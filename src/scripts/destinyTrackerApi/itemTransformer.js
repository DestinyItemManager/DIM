class itemTransformer {
  translateToDtrWeapon(weapon) {
    return {
      referenceId: weapon.hash,
      roll: this.getDtrRoll(weapon)
    };
  }

  getRollAndPerks(weapon) {
    return {
      roll: this.getDtrRoll(weapon),
      selectedPerks: this.getDtrPerks(weapon),
      referenceId: weapon.hash,
      instanceId: weapon.id,
    };
  }

  getDtrPerks(weapon) {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrPerks;
  }

  getDtrRoll(weapon) {
    if (!weapon.talentGrid) {
      return null;
    }

    return weapon.talentGrid.dtrRoll;
  }
}

export { itemTransformer };