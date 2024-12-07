import { RoundUpToFivePipe } from './round-up-to-five.pipe';

describe('RoundUpToFivePipe', () => {
  it('create an instance', () => {
    const pipe = new RoundUpToFivePipe();
    expect(pipe).toBeTruthy();
  });
});
