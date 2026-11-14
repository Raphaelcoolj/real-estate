/** Resolve a promise with a fallback so a cold database never blanks a page. */
export async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[settle] falling back:", error instanceof Error ? error.message : error);
    }
    return fallback;
  }
}
