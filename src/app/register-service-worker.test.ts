import { isNewVersion } from './register-service-worker';

describe('isNewVersion', () => {
  it('should recognize two identical versions', async () => {
    expect(isNewVersion('6.44.0.1000100', '6.44.0.1000100')).toBe(false);
  });

  it('should newer versions', async () => {
    expect(isNewVersion('6.45.0.1000100', '6.44.0.1000100')).toBe(true);
  });

  it('should ignore older versions', async () => {
    expect(isNewVersion('6.40.0.1000100', '6.44.0.1000100')).toBe(false);
  });
});
