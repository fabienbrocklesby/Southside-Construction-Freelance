import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cmsDir = path.resolve(scriptDir, '..');
const repoDir = path.resolve(cmsDir, '..');
const contentManagerRoots = [repoDir, cmsDir];

const sourcePatches = contentManagerRoots.flatMap((rootDir) => [
  {
    file: path.join(rootDir, 'node_modules/@strapi/content-manager/dist/admin/hooks/useDocumentLayout.js'),
    replacements: [
      [
        'const { data, isLoading: isLoadingConfigs, error } = contentTypes.useGetContentTypeConfigurationQuery(model);\n    const isLoading = isLoadingSchemas || isLoadingConfigs;',
        'const { data, currentData, isLoading: isLoadingConfigs, isFetching: isFetchingConfigs, error } = contentTypes.useGetContentTypeConfigurationQuery(model);\n    const configuration = currentData ?? data;\n    const hasConfigurationForModel = configuration?.contentType?.uid === model;\n    const isLoading = isLoadingSchemas || isLoadingConfigs || isFetchingConfigs || !hasConfigurationForModel;',
      ],
      ['data && !isLoading ? formatEditLayout(data, {', 'configuration && !isLoading ? formatEditLayout(configuration, {'],
      ['return data && !isLoading ? formatListLayout(data, {', 'return configuration && !isLoading ? formatListLayout(configuration, {'],
      ['if (!data || isLoading) {', 'if (!configuration || isLoading) {'],
      ['componentConfigurations: data.components,', 'componentConfigurations: configuration.components,'],
      ['data,\n        isLoading,', 'configuration,\n        isLoading,'],
    ],
  },
  {
    file: path.join(rootDir, 'node_modules/@strapi/content-manager/dist/admin/hooks/useDocumentLayout.mjs'),
    replacements: [
      [
        'const { data, isLoading: isLoadingConfigs, error } = useGetContentTypeConfigurationQuery(model);\n    const isLoading = isLoadingSchemas || isLoadingConfigs;',
        'const { data, currentData, isLoading: isLoadingConfigs, isFetching: isFetchingConfigs, error } = useGetContentTypeConfigurationQuery(model);\n    const configuration = currentData ?? data;\n    const hasConfigurationForModel = configuration?.contentType?.uid === model;\n    const isLoading = isLoadingSchemas || isLoadingConfigs || isFetchingConfigs || !hasConfigurationForModel;',
      ],
      ['data && !isLoading ? formatEditLayout(data, {', 'configuration && !isLoading ? formatEditLayout(configuration, {'],
      ['return data && !isLoading ? formatListLayout(data, {', 'return configuration && !isLoading ? formatListLayout(configuration, {'],
      ['if (!data || isLoading) {', 'if (!configuration || isLoading) {'],
      ['componentConfigurations: data.components,', 'componentConfigurations: configuration.components,'],
      ['data,\n        isLoading,', 'configuration,\n        isLoading,'],
    ],
  },
]);

const vitePatch = {
  file: path.join(cmsDir, 'node_modules/.strapi/vite/deps/chunk-GNEARM3H.js'),
  replacements: [
    [
      'const { data, isLoading: isLoadingConfigs, error } = useGetContentTypeConfigurationQuery(model);\n  const isLoading = isLoadingSchemas || isLoadingConfigs;',
      'const { data, currentData, isLoading: isLoadingConfigs, isFetching: isFetchingConfigs, error } = useGetContentTypeConfigurationQuery(model);\n  const configuration = currentData ?? data;\n  const hasConfigurationForModel = configuration?.contentType?.uid === model;\n  const isLoading = isLoadingSchemas || isLoadingConfigs || isFetchingConfigs || !hasConfigurationForModel;',
    ],
    ['data && !isLoading ? formatEditLayout(data, {', 'configuration && !isLoading ? formatEditLayout(configuration, {'],
    ['return data && !isLoading ? formatListLayout(data, {', 'return configuration && !isLoading ? formatListLayout(configuration, {'],
    ['if (!data || isLoading) {', 'if (!configuration || isLoading) {'],
    ['componentConfigurations: data.components,', 'componentConfigurations: configuration.components,'],
    ['data,\n    isLoading,', 'configuration,\n    isLoading,'],
  ],
};

async function patchFile({ file, replacements }) {
  let contents;

  try {
    contents = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { file, status: 'missing' };
    }

    throw error;
  }

  let next = contents;
  let changed = false;

  for (const [before, after] of replacements) {
    if (next.includes(after)) {
      continue;
    }

    if (!next.includes(before)) {
      throw new Error(`Could not find expected Strapi code in ${file}`);
    }

    next = next.replace(before, after);
    changed = true;
  }

  if (changed) {
    await fs.writeFile(file, next);
  }

  return { file, status: changed ? 'patched' : 'already-patched' };
}

const results = [];

for (const patch of [...sourcePatches, vitePatch]) {
  results.push(await patchFile(patch));
}

for (const result of results) {
  console.log(`${result.status}: ${path.relative(repoDir, result.file)}`);
}
