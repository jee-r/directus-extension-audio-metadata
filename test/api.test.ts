import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import operation from "../src/api"

const fixturesDir = join(__dirname, "fixtures")

function mockFetchForFixture(fileName: string, contentType: string) {
  const fullBuffer = readFileSync(join(fixturesDir, fileName))

  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const rangeHeader = (init?.headers as Record<string, string> | undefined)
      ?.Range
    let body = fullBuffer

    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d+)/.exec(rangeHeader)
      if (match) {
        const start = Number(match[1])
        const end = Number(match[2])
        body = fullBuffer.subarray(start, end + 1)
      }
    }

    return new Response(body, {
      status: 200,
      headers: { "content-type": contentType },
    })
  })

  vi.stubGlobal("fetch", fetchMock)

  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("audio-metadata operation", () => {
  it("extracts duration from an MP3 with ID3 tags using a header-only range request", async () => {
    const fetchMock = mockFetchForFixture("short.mp3", "audio/mpeg")

    const result = await operation.handler({
      fileKey: "short.mp3",
      maxBytes: 262144,
      downloadFullFile: false,
      baseUrl: "https://example.com/assets",
      accessToken: null,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/assets/short.mp3",
      expect.objectContaining({
        headers: expect.objectContaining({ Range: "bytes=0-262143" }),
      })
    )
    expect(result).toMatchObject({
      file_url: "https://example.com/assets/short.mp3",
      usedFullFile: false,
    })
    expect((result as { durationms: number }).durationms).toBeGreaterThan(
      1900
    )
    expect((result as { durationms: number }).durationms).toBeLessThan(2100)
  })

  it("extracts duration from a FLAC file", async () => {
    mockFetchForFixture("short.flac", "audio/flac")

    const result = await operation.handler({
      fileKey: "short.flac",
      maxBytes: 262144,
      downloadFullFile: false,
      baseUrl: "https://example.com/assets",
      accessToken: null,
    })

    expect((result as { durationms: number }).durationms).toBeGreaterThan(
      1900
    )
    expect((result as { durationms: number }).durationms).toBeLessThan(2100)
  })

  it("extracts duration from an untagged WAV file", async () => {
    mockFetchForFixture("short.wav", "audio/wav")

    const result = await operation.handler({
      fileKey: "short.wav",
      maxBytes: 262144,
      downloadFullFile: false,
      baseUrl: "https://example.com/assets",
      accessToken: null,
    })

    expect((result as { durationms: number }).durationms).toBeGreaterThan(
      1900
    )
    expect((result as { durationms: number }).durationms).toBeLessThan(2100)
  })

  it("downloads the full file and sends no Range header when downloadFullFile is true", async () => {
    const fetchMock = mockFetchForFixture("short.mp3", "audio/mpeg")

    const result = await operation.handler({
      fileKey: "short.mp3",
      maxBytes: 262144,
      downloadFullFile: true,
      baseUrl: "https://example.com/assets",
      accessToken: null,
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).not.toHaveProperty("Range")
    expect(result).toMatchObject({ usedFullFile: true })
  })

  it("sends an Authorization header when an access token is provided", async () => {
    const fetchMock = mockFetchForFixture("short.mp3", "audio/mpeg")

    await operation.handler({
      fileKey: "short.mp3",
      maxBytes: 262144,
      downloadFullFile: false,
      baseUrl: "https://example.com/assets",
      accessToken: "secret-token",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      })
    )
  })

  it("throws when fileKey is missing", async () => {
    await expect(
      operation.handler({
        fileKey: "",
        maxBytes: 262144,
        downloadFullFile: false,
        baseUrl: "https://example.com/assets",
        accessToken: null,
      })
    ).rejects.toThrow("File key is required")
  })

  it("throws a descriptive error when the fetch response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, { status: 404, statusText: "Not Found" })
      )
    )

    await expect(
      operation.handler({
        fileKey: "missing.mp3",
        maxBytes: 262144,
        downloadFullFile: false,
        baseUrl: "https://example.com/assets",
        accessToken: null,
      })
    ).rejects.toThrow(/404/)
  })
})
