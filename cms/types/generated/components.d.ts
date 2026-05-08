import type { Schema, Struct } from '@strapi/strapi';

export interface SharedBulletItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_bullet_items';
  info: {
    description: 'A short bullet point used in editable page sections.';
    displayName: 'Bullet Item';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSideImage extends Struct.ComponentSchema {
  collectionName: 'components_shared_side_images';
  info: {
    description: 'An image with alt text for page-side image grids.';
    displayName: 'Side Image';
  };
  attributes: {
    altText: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.bullet-item': SharedBulletItem;
      'shared.side-image': SharedSideImage;
    }
  }
}
