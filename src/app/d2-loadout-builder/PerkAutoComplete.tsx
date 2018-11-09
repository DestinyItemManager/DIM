import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { InventoryBucket } from '../inventory/inventory-buckets';

interface Props {
  perks: { [bucketHash: number]: DestinyInventoryItemDefinition[] };
  bucketsById: { [hash: number]: InventoryBucket };
  selectedPerks: Set<number>;
  onSelect(bucket: InventoryBucket, perk: DestinyInventoryItemDefinition): void;
}

interface State {
  value: string;
  suggestions: any[];
}

const perkOptions: {
  bucket: InventoryBucket;
  perks: DestinyInventoryItemDefinition[];
}[] = [];

function getSuggestions(value) {
  const inputValue = value.trim().toLowerCase();

  return perkOptions
    .map((section) => {
      return {
        bucket: section.bucket,
        perks: section.perks.filter((perk) =>
          perk.displayProperties.name.toLowerCase().includes(inputValue)
        )
      };
    })
    .filter((section) => section.perks.length > 0);
}
const getSuggestionValue = () => 'noop';
const getSectionSuggestions = (section) => section.perks;
const renderSectionTitle = (section) => section.bucket.name;

export default class PerkAutoComplete extends React.Component<Props, State> {
  state: State = {
    value: '',
    suggestions: []
  };

  componentDidMount() {
    const { perks, bucketsById } = this.props;
    Object.keys(perks).forEach((bucketType) => {
      perkOptions.push({
        bucket: bucketsById[bucketType],
        perks: perks[bucketType]
      });
    });
  }

  onChange = (_, { newValue }) => {
    if (newValue !== 'noop') {
      this.setState({
        value: newValue
      });
    }
  };

  // Autosuggest will call this function every time you need to update suggestions.
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: getSuggestions(value)
    });
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  renderSuggestion = (suggestion) => (
    <div
      className={classNames({ 'selected-perk': this.props.selectedPerks.has(suggestion.index) })}
    >
      {suggestion.displayProperties.name}
    </div>
  );

  render() {
    const { value, suggestions } = this.state;

    const inputProps = {
      placeholder: t('LoadoutBuilder.Autosuggest'),
      value,
      onChange: this.onChange
    };

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        getSectionSuggestions={getSectionSuggestions}
        focusInputOnSuggestionClick={false}
        renderSuggestion={this.renderSuggestion}
        renderSectionTitle={renderSectionTitle}
        inputProps={inputProps}
        multiSection={true}
        onSuggestionSelected={(_, { suggestion, sectionIndex }) => {
          this.props.onSelect(this.state.suggestions[sectionIndex].bucket, suggestion);
        }}
      />
    );
  }
}
