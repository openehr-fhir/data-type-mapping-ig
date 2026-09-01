/** Minimal structural types for the remaining FHIR R5 types. */

/** `Attachment`. */
export interface Attachment {
  readonly contentType?: string;
  readonly language?: string;
  readonly data?: string;
  readonly url?: string;
  readonly size?: number;
  readonly hash?: string;
  readonly title?: string;
  readonly creation?: string;
  readonly height?: number;
  readonly width?: number;
  readonly frames?: number;
  readonly duration?: number;
  readonly pages?: number;
}
