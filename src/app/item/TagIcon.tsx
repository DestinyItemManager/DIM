import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { itemTagList, TagValue } from 'app/inventory/dim-item-info';
import { AppIcon } from 'app/shell/icons';
import React from 'react';

const tagIcons: { [tag: string]: string | IconDefinition | undefined } = {};
itemTagList.forEach((tag) => {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
});

export default function TagIcon({ className, tag }: { className?: string; tag: TagValue }) {
  return tagIcons[tag] ? <AppIcon className={className} icon={tagIcons[tag]!} /> : null;
}
