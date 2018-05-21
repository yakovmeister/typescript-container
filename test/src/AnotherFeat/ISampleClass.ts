export interface ISampleClass {
  callMe(): string;
}

export abstract class SampleClass implements ISampleClass {
  abstract callMe();
}