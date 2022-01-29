import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AppIcon } from 'app/shell/icons';
import React from 'react';
import { itemTagList, TagValue } from '../inventory-stores/dim-item-info';

const tagIcons: { [tag: string]: string | IconDefinition | undefined } = {};
itemTagList.forEach((tag) => {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
});

export default function TagIcon({ className, tag }: { className?: string; tag: TagValue }) {
  return tagIcons[tag] ? <AppIcon className={className} icon={tagIcons[tag]!} /> : null;
}
