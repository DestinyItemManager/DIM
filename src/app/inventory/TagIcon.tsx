import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AppIcon } from 'app/shell/icons';
import { itemTagList, TagValue } from './dim-item-info';

const tagIcons: { [tag: string]: string | IconDefinition | undefined } = {};
for (const tag of itemTagList) {
  if (tag.type) {
    tagIcons[tag.type] = tag.icon;
  }
}

export default function TagIcon({ className, tag }: { className?: string; tag: TagValue }) {
  return tagIcons[tag] ? <AppIcon className={className} icon={tagIcons[tag]!} /> : null;
}
