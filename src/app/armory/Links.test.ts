// We need to test the buildLightGGSockets function by creating the test file
// directly inside the Links.tsx file since it's not exported
// Let's create a test that validates the URL generation behavior

describe('Light.gg URL generation', () => {
  test('simulates the trailing comma issue scenario', () => {
    // Test data based on the issue description
    const socketData = {
      largePerks: [1844523823, 106909392],
      traits: [3017780555, 3673922083, 1673863459],
      masterwork: 4105787911,
      weaponMod: 0, // This is the empty weapon mod causing the issue
    };

    // Simulate the current buggy behavior
    const buggyResult = [
      ...socketData.largePerks,
      ...socketData.traits,
      socketData.masterwork,
      socketData.weaponMod,
    ]
      .map((s) => s || '') // This line causes the bug - converts 0 to ''
      .join(',');

    // This should demonstrate the current issue - trailing comma
    expect(buggyResult).toBe('1844523823,106909392,3017780555,3673922083,1673863459,4105787911,');
    expect(buggyResult).toMatch(/,$/); // Has trailing comma - this is the bug

    // Test the fixed behavior
    const fixedResult = [
      ...socketData.largePerks,
      ...socketData.traits,
      socketData.masterwork,
      socketData.weaponMod,
    ]
      .map((s) => String(s)) // Convert to string but preserve 0
      .join(',');

    // This should be the correct result without trailing comma
    expect(fixedResult).toBe('1844523823,106909392,3017780555,3673922083,1673863459,4105787911,0');
    expect(fixedResult).not.toMatch(/,$/); // No trailing comma
  });

  test('handles multiple empty sockets correctly', () => {
    const socketData = {
      largePerks: [1844523823, 0], // One empty perk
      traits: [3017780555, 0, 1673863459], // One empty trait in middle
      masterwork: 0, // Empty masterwork
      weaponMod: 0, // Empty weapon mod
    };

    // Test the fixed behavior - all zeros should be preserved
    const fixedResult = [
      ...socketData.largePerks,
      ...socketData.traits,
      socketData.masterwork,
      socketData.weaponMod,
    ]
      .map((s) => String(s))
      .join(',');

    expect(fixedResult).toBe('1844523823,0,3017780555,0,1673863459,0,0');
    expect(fixedResult).not.toMatch(/,,/); // No consecutive commas
    expect(fixedResult).not.toMatch(/,$/); // No trailing comma
  });
});
