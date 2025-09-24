import Environment from '../../utils/environmentDetection';

describe('Environment Detection', () => {
  test('should detect web environment by default', () => {
    // In a standard Jest environment, it should be detected as web
    expect(Environment.isWeb()).toBe(true);
    expect(Environment.isTauri()).toBe(false);
  });

  test('should provide environment description', () => {
    const description = Environment.getDescription();
    expect(typeof description).toBe('string');
    expect(description).toContain('WEB');
  });
  
  test('should provide detailed environment description when requested', () => {
    const description = Environment.getDescription(true);
    expect(description).toContain('Environment:');
  });
});
