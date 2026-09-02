/** Minimal structural types for the remaining FHIR R5 types. */

import type { FhirInteger64 } from './primitives.ts';

/** `Attachment`. */
export interface Attachment {
  readonly contentType?: string;
  readonly language?: string;
  readonly data?: string;
  readonly url?: string;
  /** R5 types `Attachment.size` as an `integer64`, so the wire form is a JSON String. */
  readonly size?: FhirInteger64;
  readonly hash?: string;
  readonly title?: string;
  readonly creation?: string;
  readonly height?: number;
  readonly width?: number;
  readonly frames?: number;
  readonly duration?: number;
  readonly pages?: number;
}
