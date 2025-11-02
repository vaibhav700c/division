import { apiCall } from "@/lib/api-client"
import { jest } from "@jest/globals"

describe("apiCall", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should make a successful API call", async () => {
    const mockData = { id: "1", name: "Test" }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const result = await apiCall("/test")
    expect(result).toEqual(mockData)
  })

  it("should handle API errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    await expect(apiCall("/test")).rejects.toThrow()
  })

  it("should append query parameters", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await apiCall("/test", { params: { id: "1", status: "active" } })

    const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
    expect(callUrl).toContain("id=1")
    expect(callUrl).toContain("status=active")
  })
})
