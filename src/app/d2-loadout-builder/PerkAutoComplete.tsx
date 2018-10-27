import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import { InventoryBucket } from '../inventory/inventory-buckets';

interface Props {
  perks: {
    [bucketHash: number]: DestinyInventoryItemDefinition[];
  };
  bucketsById: {
    [hash: number]: InventoryBucket;
  };
  onSelect(bucket: InventoryBucket, perk: DestinyInventoryItemDefinition): void;
}

interface State {
  value: string;
  lastValue: string;
  suggestions: any[];
}

let perkOptions: {
  bucket: InventoryBucket;
  perks: DestinyInventoryItemDefinition[];
}[] = [];

const getPerkOptions = (perks, bucketsById) => {
  const allPerks: {
    bucket: InventoryBucket;
    perks: DestinyInventoryItemDefinition[];
  }[] = [];
  Object.keys(perks).forEach((bucketType) => {
    allPerks.push({
      bucket: bucketsById[bucketType],
      perks: perks[bucketType]
    });
  });
  return allPerks;
};

// Teach Autosuggest how to calculate suggestions for any given input value.
function getSuggestions(value) {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  return perkOptions
    .map((section) => {
      return {
        bucket: section.bucket,
        perks: section.perks.filter(
          (perk) => perk.displayProperties.name.toLowerCase().slice(0, inputLength) === inputValue
        )
      };
    })
    .filter((section) => section.perks.length > 0);
}

const getSuggestionValue = (suggestion) => suggestion.displayProperties.name;
const renderSuggestion = (suggestion) => <div>{suggestion.displayProperties.name}</div>;

const getSectionSuggestions = (section) => section.perks;
const renderSectionTitle = (section) => <strong>{section.bucket.name}</strong>;

export default class PerkAutoComplete extends React.Component<Props, State> {
  state: State = {
    value: '',
    lastValue: '',
    suggestions: []
  };

  componentDidMount() {
    perkOptions = getPerkOptions(this.props.perks, this.props.bucketsById);
  }

  onChange = (_, { newValue }) => {
    this.setState({
      value: newValue,
      lastValue: newValue
    });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
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

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: '[BETA] Search for a perk',
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
        renderSuggestion={renderSuggestion}
        renderSectionTitle={renderSectionTitle}
        inputProps={inputProps}
        multiSection={true}
        onSuggestionSelected={(_, { suggestion, sectionIndex }) => {
          this.setState({ value: this.state.lastValue });
          this.props.onSelect(this.state.suggestions[sectionIndex].bucket, suggestion);
        }}
      />
    );
  }
}
