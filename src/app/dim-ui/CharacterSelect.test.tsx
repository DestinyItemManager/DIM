import React from 'react';
import TestRenderer from 'react-test-renderer';
import CharacterSelect from './CharacterSelect';
import { DimStore } from '../inventory/store-types';
import { Frame, Track, ViewPager } from 'react-view-pager';
import SimpleCharacterTile from 'app/inventory/SimpleCharacterTile';

const stubDimStore: DimStore = {} as DimStore;
const stubDimStoreArray: DimStore[] = [];
const dimStore1: DimStore = {} as DimStore;
const dimStore2: DimStore = {} as DimStore;
const dimStore3: DimStore = {} as DimStore;
const mockOnCharacterChanged = jest.fn();

beforeEach(() => {
  dimStore1.id = '2';
  dimStore1.isDestiny1 = () => false;
  dimStore1.isDestiny2 = () => true;
  dimStore1.isVault = false;
  dimStore2.id = '3';
  dimStore2.isDestiny1 = () => false;
  dimStore2.isDestiny2 = () => true;
  dimStore2.isVault = true;
  dimStore3.id = '4';
  dimStore3.isDestiny1 = () => false;
  dimStore3.isDestiny2 = () => true;
  dimStore3.isVault = false;
  stubDimStoreArray[0] = dimStore1;
  stubDimStoreArray[1] = dimStore2;
  stubDimStoreArray[2] = dimStore3;
});
it('should render horizontal phone interface ', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={true}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // If ViewPager, Frame, and Track are not null, we have entered the correct branch
  expect(testInstance.findByType(ViewPager)).not.toBeNull();
  expect(testInstance.findByType(Frame)).not.toBeNull();
  expect(testInstance.findByType(Track)).not.toBeNull();
});

it('should render the non-phone interface ', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={false}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // If ViewPager, Frame, and Track are not there, we have entered the correct branch
  expect(testInstance.findAllByType(ViewPager)).toHaveLength(0);
  expect(testInstance.findAllByType(Frame)).toHaveLength(0);
  expect(testInstance.findAllByType(Track)).toHaveLength(0);
});

it('should render all non-vault stores in the phone interface', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={true}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // There are two non-vault mocked DimStore objects. Both should render.
  expect(testInstance.findAllByType(SimpleCharacterTile).length).toBe(2);
});

it('should render all non-vault stores in the non-phone interface', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={false}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // There are two non-vault mocked DimStore objects. Both should render.
  expect(testInstance.findAllByType(SimpleCharacterTile).length).toBe(2);
});

it('should call the onCharacterChanged function on click in the phone interface', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={true}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // Simulate a click event
  testInstance.findAllByType(SimpleCharacterTile)[0].props.onClick();
  expect(mockOnCharacterChanged).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();
});

it('should call the onCharacterChanged function on click in the non-phone interface', () => {
  const testRenderer = TestRenderer.create(
    <CharacterSelect
      stores={stubDimStoreArray}
      selectedStore={stubDimStore}
      vertical={false}
      isPhonePortrait={false}
      onCharacterChanged={mockOnCharacterChanged}
    />
  );
  const testInstance = testRenderer.root;
  // Simulate a click event
  testInstance.findAllByType(SimpleCharacterTile)[0].props.onClick();
  expect(mockOnCharacterChanged).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();
});
