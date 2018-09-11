import * as React from 'react';
import { Settings, settings } from '../settings/settings';
import classNames from 'classnames';

interface Props {
  sectionId: string;
  title: React.ReactNode;
  collapsedSections: Settings['collapsedSections'];
  children?: React.ReactNode;
}

export default class CollapsibleTitle extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return (
      nextProps.title !== this.props.title ||
      nextProps.children !== this.props.children ||
      nextProps.sectionId !== this.props.sectionId ||
      nextProps.collapsedSections[nextProps.sectionId] !==
        this.props.collapsedSections[this.props.sectionId]
    );
  }

  render() {
    const { sectionId, title, collapsedSections, children } = this.props;
    return (
      <div className="title" onClick={() => this.toggleSection(sectionId)}>
        <span className="collapse-handle">
          <i
            className={classNames(
              'fa collapse',
              collapsedSections[sectionId]
                ? 'fa-plus-square-o'
                : 'fa-minus-square-o'
            )}
          />{' '}
          <span>{title}</span>
        </span>
        {children}
      </div>
    );
  }

  toggleSection = (id: string) => {
    // TODO: make an action, don't directly modify settings
    // At least we're immutably updating the sections
    settings.collapsedSections = {
      ...settings.collapsedSections,
      [id]: !settings.collapsedSections[id]
    };
    settings.save();
  }
}
