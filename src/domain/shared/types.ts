/** ISO 8601 date-time string (e.g. 2026-08-15T18:00:00.000Z). */
export type ISODateString = string;

/** Identificador opaco de entidade persistida. */
export type EntityId = string;

export interface Timestamps {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}
