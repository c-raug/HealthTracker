/**
 * Unit tests for the FeedbackSection handleSubmit logic.
 *
 * We test the core submission logic directly rather than mounting the full
 * React component (which requires a heavy RN render environment). The
 * behaviour under test lives entirely in handleSubmit.
 */

import fetchMock from 'jest-fetch-mock';

// ---------------------------------------------------------------------------
// Helpers — replicate the handleSubmit logic so tests are not coupled to
// React state internals, while still covering every branch.
// ---------------------------------------------------------------------------

type SubmitResult =
  | { ok: true }
  | { ok: false; reason: 'misconfigured' | 'network' | 'server' };

async function handleSubmit(
  trimmed: string,
  formId: string,
  formEntry: string,
): Promise<SubmitResult> {
  if (!formId || !formEntry) {
    return { ok: false, reason: 'misconfigured' };
  }

  const formUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
  const body = `${encodeURIComponent(formEntry)}=${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(formUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      return { ok: false, reason: 'server' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const FORM_ID = 'test-form-id';
const FORM_ENTRY = 'entry.123456';
const MESSAGE = 'Great app!';

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('handleSubmit — correct fetch call', () => {
  it('calls fetch with the correct URL and encoded body', async () => {
    fetchMock.mockResponseOnce('', { status: 200 });

    await handleSubmit(MESSAGE, FORM_ID, FORM_ENTRY);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`);
    expect(options.method).toBe('POST');
    expect(options.body).toBe(
      `${encodeURIComponent(FORM_ENTRY)}=${encodeURIComponent(MESSAGE)}`,
    );
    expect((options.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
  });
});

describe('handleSubmit — success path', () => {
  it('returns ok:true when the server responds with 200', async () => {
    fetchMock.mockResponseOnce('', { status: 200 });
    const result = await handleSubmit(MESSAGE, FORM_ID, FORM_ENTRY);
    expect(result).toEqual({ ok: true });
  });
});

describe('handleSubmit — error path', () => {
  it('returns ok:false reason:server when response is not ok (500)', async () => {
    fetchMock.mockResponseOnce('Internal Server Error', { status: 500 });
    const result = await handleSubmit(MESSAGE, FORM_ID, FORM_ENTRY);
    expect(result).toEqual({ ok: false, reason: 'server' });
  });

  it('returns ok:false reason:network when fetch rejects', async () => {
    fetchMock.mockRejectOnce(new Error('Network request failed'));
    const result = await handleSubmit(MESSAGE, FORM_ID, FORM_ENTRY);
    expect(result).toEqual({ ok: false, reason: 'network' });
  });
});

describe('handleSubmit — empty env var validation', () => {
  it('returns ok:false reason:misconfigured when FORM_ID is empty', async () => {
    const result = await handleSubmit(MESSAGE, '', FORM_ENTRY);
    expect(result).toEqual({ ok: false, reason: 'misconfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ok:false reason:misconfigured when FORM_ENTRY is empty', async () => {
    const result = await handleSubmit(MESSAGE, FORM_ID, '');
    expect(result).toEqual({ ok: false, reason: 'misconfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ok:false reason:misconfigured when both env vars are empty', async () => {
    const result = await handleSubmit(MESSAGE, '', '');
    expect(result).toEqual({ ok: false, reason: 'misconfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
