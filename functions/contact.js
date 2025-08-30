const ALLOWED_ORIGINS = [
  'http://localhost:4321',
  'https://localhost:4321',
  'http://127.0.0.1:4321',
  'https://127.0.0.1:4321',
  'https://southsideconstruction.nz',
  'https://www.southsideconstruction.nz',
];

function buildCorsHeaders(origin) {
  // Reflect origin if in allowlist OR if localhost (dev convenience), else fallback to primary domain.
  const isLocal = /localhost|127\.0\.0\.1/.test(origin || '');
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || isLocal) ? origin : 'https://southsideconstruction.nz';
  return {
    'Vary': 'Origin',
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const debug = url.searchParams.has('debug');
  let stage = 'init';
  const origin = request.headers.get('Origin') || '';
  const originAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || /localhost|127\.0\.0\.1/.test(origin);
  const corsHeaders = buildCorsHeaders(origin);

  const respond = (status, payload, extraHeaders={}) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders }
  });

  if (!originAllowed) {
    // Still send CORS headers so browser surfaces JSON not a network error
    return respond(200, { success: false, code: 'ORIGIN_NOT_ALLOWED', message: 'Origin not allowed.' });
  }

  try {
    if (request.method !== 'POST') {
      return respond(405, { success: false, code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' });
    }

    let formData;
    try {
  stage = 'parse_form';
      formData = await request.formData();
    } catch (e) {
      return respond(400, { success: false, code: 'BAD_FORM_DATA', message: 'Invalid form submission.' });
    }

    const raw = (name) => {
      const v = formData.get(name);
      return (typeof v === 'string') ? v.trim() : '';
    };

    // Southside form fields
    const fullName  = raw('name');
    const email     = raw('email');
    const phone     = raw('phone') || 'Not provided';
    const location  = raw('location') || 'Not provided';
    const service   = raw('service') || 'Not specified';
    const timeline  = raw('timeline') || 'Not specified';
    const message   = raw('message');

    // Derive first/last for email niceties
    let firstName = fullName;
    let lastName = '';
    if (fullName.includes(' ')) {
      const parts = fullName.split(/\s+/);
      firstName = parts.shift();
      lastName = parts.join(' ');
    }

    // Validation rules
  stage = 'validate_basic';
  if (!fullName || !email || !message) {
      return respond(400, { success: false, code: 'MISSING_FIELDS', message: 'Please fill in all required fields.' });
    }
    if (fullName.length > 120) {
      return respond(400, { success: false, code: 'NAME_TOO_LONG', message: 'Name must be 120 characters or less.' });
    }
    if (message.length < 10) {
      return respond(400, { success: false, code: 'MESSAGE_TOO_SHORT', message: 'Message must be at least 10 characters.' });
    }
    if (message.length > 4000) {
      return respond(400, { success: false, code: 'MESSAGE_TOO_LONG', message: 'Message exceeds 4000 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return respond(400, { success: false, code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' });
    }

  stage = 'env_check';
  const { ZEPTO_API_KEY, FROM_EMAIL, SOUTHSIDE_EMAIL, RECIPIENT_EMAIL } = env; // FROM_EMAIL will be used as Zepto "from" address
    const DEST_EMAIL = SOUTHSIDE_EMAIL || RECIPIENT_EMAIL || 'southside@fabienbrocklesby.com';
    if (!ZEPTO_API_KEY || !FROM_EMAIL || !DEST_EMAIL) {
      const diag = { hasZEPTO_API_KEY: !!ZEPTO_API_KEY, hasFROM_EMAIL: !!FROM_EMAIL, hasDEST_EMAIL: !!DEST_EMAIL };
      console.error('Config error - missing env', diag);
      return respond(500, { success: false, code: 'SERVER_MISCONFIGURED', message: 'Email service not configured.', diagnostics: diag });
    }

    // Basic HTML escaping for user supplied fields (very light weight)
    const esc = (s) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const safeMessage = esc(message).replace(/\n/g, '<br>');

  stage = 'prepare_payloads';
  // ZeptoMail payloads
  const adminEmailData = {
    from: { address: FROM_EMAIL, name: 'Southside Construction Website' },
    to: [ { email_address: { address: DEST_EMAIL, name: 'Southside Construction' } } ],
      reply_to: [ { address: email } ],
    subject: `New Enquiry: ${fullName}${service && service !== 'Not specified' ? ' — ' + service : ''}`.slice(0, 120),
      htmlbody: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
      <h2 style="color:#111111; margin-top:0;">New Website Enquiry</h2>
      <p><strong>Name:</strong> ${esc(fullName)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Phone:</strong> ${esc(phone)}</p>
      <p><strong>Location:</strong> ${esc(location)}</p>
      <p><strong>Service:</strong> ${esc(service)}</p>
      <p><strong>Timeline:</strong> ${esc(timeline)}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f3f4f6; padding:15px; border-radius:5px; line-height:1.5;">${safeMessage}</div>
          <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
      <p style="font-size:12px; color:#6b7280;">Sent automatically from the Southside Construction website.</p>
        </div>`
  };

  const customerEmailData = {
    from: { address: FROM_EMAIL, name: 'Southside Construction' },
    to: [ { email_address: { address: email, name: `${fullName}` } } ],
    subject: 'Thanks for contacting Southside Construction',
      htmlbody: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
      <h2 style="color:#111111; margin-top:0;">Thanks — we’ve got your message</h2>
      <p>Hello ${esc(firstName)},</p>
      <p>Thanks for reaching out to Southside Construction. We’ll come back to you ASAP (usually within one business day) with next steps.</p>
      <p style="margin-top:16px;">In the meantime, feel free to reply to this email with any plans or inspiration photos.</p>
      <p style="margin-top:20px;">— Southside Construction</p>
          <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px; color:#6b7280;">If you did not submit this request, you can ignore this email.</p>
        </div>`
  };

    async function sendEmail(payload, label) {
      try {
        const resp = await fetch('https://api.zeptomail.com.au/v1.1/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Zoho-enczapikey ${ZEPTO_API_KEY}`
          },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const text = await resp.text();
          let parsed; try { parsed = JSON.parse(text); } catch(_) {}
          const errMsg = parsed?.message || parsed?.error || text.slice(0,400);
          console.error(`ZeptoMail ${label} email failed`, resp.status, errMsg);
          return { ok: false, status: resp.status, errorMessage: errMsg };
        }
        return { ok: true };
      } catch (err) {
        console.error(`ZeptoMail ${label} email threw`, err);
        return { ok: false, status: 0, errorMessage: String(err) };
      }
    }

    function classifyProviderFailure(status, msg='') {
      if (status === 401) return { hint: 'Invalid ZeptoMail API key or key not authorized.', category: 'auth' };
      if (status === 403) return { hint: 'Forbidden – check domain / sender verification in ZeptoMail.', category: 'forbidden' };
      if (status === 400) return { hint: 'Bad request – verify email addresses and payload shape.', category: 'payload' };
      if (status === 429) return { hint: 'Rate limited by ZeptoMail – slow down.', category: 'rate_limit' };
      if (status >= 500) return { hint: 'ZeptoMail service issue – retry later.', category: 'provider_outage' };
      if (status === 0) return { hint: 'Network error reaching ZeptoMail.', category: 'network' };
      return { hint: 'Unknown ZeptoMail failure – check logs.', category: 'unknown' };
    }

    stage = 'send_admin';
    const adminResult = await sendEmail(adminEmailData, 'admin');
    if (!adminResult.ok) {
      const classification = classifyProviderFailure(adminResult.status, adminResult.errorMessage);
      return respond(200, { success: false, code: 'ADMIN_EMAIL_FAIL', message: 'Unable to send notification email right now.', providerStatus: adminResult.status, hint: classification.hint, category: classification.category, debug: debug ? { stage, status: adminResult.status, error: adminResult.errorMessage } : undefined });
    }

    stage = 'send_customer';
    const customerResult = await sendEmail(customerEmailData, 'customer');
    if (!customerResult.ok) {
      const classification = classifyProviderFailure(customerResult.status, customerResult.errorMessage);
      return respond(200, { success: true, code: 'PARTIAL_SUCCESS', message: 'Message received. Reply email failed to send, but your enquiry was delivered.', providerStatus: customerResult.status, hint: classification.hint, category: classification.category, debug: debug ? { stage, status: customerResult.status, error: customerResult.errorMessage } : undefined });
    }

    stage = 'done';
    return respond(200, { success: true, code: 'OK', message: "Thank you for your message! I'll get back to you within 24 hours.", debug: debug ? { stage } : undefined });

  } catch (err) {
    console.error('Unhandled contact form error:', err);
    return respond(500, { success: false, code: 'UNEXPECTED_ERROR', message: 'Unexpected server error. Please try again shortly.', debug: debug ? { stage, error: String(err) } : undefined });
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  const corsHeaders = buildCorsHeaders(origin);
  return new Response(null, { status: 200, headers: corsHeaders });
}