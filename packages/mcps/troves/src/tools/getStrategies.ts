/**
 * Fetches strategies from Troves API
 * @returns {Promise<any>} The strategies data from the API
 */
export async function getStrategies(): Promise<any> {
  try {
    const response = await fetch('https://app.troves.fi/api/strategies');

    if (!response.ok) {
      throw new Error(`Failed to fetch strategies: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: 'success',
      data,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
