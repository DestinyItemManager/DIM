import '@destinyitemmanager/dim-api-types';

declare module '@destinyitemmanager/dim-api-types' {
  // Extending existing interface
  export interface StatConstraint {
    prioritized?: boolean;
  }
}
