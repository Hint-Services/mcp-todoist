import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { LimitlessClient } from "../src/limitless/client.js";
import type { LimitlessConfig, ListLifelogsResponse, LifelogEntry } from "../src/limitless/types.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("LimitlessClient", () => {
	let client: LimitlessClient;
	let mockAxiosInstance: any;
	const config: LimitlessConfig = {
		apiKey: "test-api-key",
		baseUrl: "https://api.limitless.ai",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Create mock axios instance
		mockAxiosInstance = {
			get: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
		};

		mockedAxios.create.mockReturnValue(mockAxiosInstance);
		client = new LimitlessClient(config);
	});

	describe("constructor", () => {
		it("should create axios instance with correct config", () => {
			expect(mockedAxios.create).toHaveBeenCalledWith({
				baseURL: config.baseUrl,
				headers: {
					"X-API-Key": config.apiKey,
					"Content-Type": "application/json",
				},
				timeout: 30000,
			});
		});
	});

	describe("getLifelogs", () => {
		it("should fetch lifelog entries successfully", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "Test conversation",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "Test content",
									type: "text",
								},
							],
						},
					],
				},
				meta: {
					lifelogs: {
						count: 1,
					},
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.getLifelogs({ date: "2024-01-15" });

			expect(mockAxiosInstance.get).toHaveBeenCalledWith("/v1/lifelogs", {
				params: { date: "2024-01-15" },
			});
			expect(result).toEqual(mockResponse);
		});

		it("should use default parameters when none provided", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [],
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			await client.getLifelogs();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith("/v1/lifelogs", {
				params: { limit: 10 },
			});
		});

		it("should handle API errors gracefully", async () => {
			const errorResponse = {
				isAxiosError: true,
				response: {
					status: 401,
					data: { message: "Invalid API key" },
				},
				message: "Request failed with status code 401",
			};

			// Mock axios.isAxiosError to return true for our error
			vi.mocked(axios.isAxiosError).mockReturnValue(true);
			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(client.getLifelogs()).rejects.toThrow(
				"Limitless API error (401): Invalid API key"
			);
		});

		it("should handle network errors", async () => {
			const networkError = new Error("Network error");
			// Ensure axios.isAxiosError returns false for regular Error
			vi.mocked(axios.isAxiosError).mockReturnValue(false);
			mockAxiosInstance.get.mockRejectedValue(networkError);

			await expect(client.getLifelogs()).rejects.toThrow(
				"Limitless API error: Network error"
			);
		});
	});

	describe("getLifelog", () => {
		it("should fetch specific lifelog entry successfully", async () => {
			const mockEntry: LifelogEntry = {
				id: "entry_123",
				title: "Detailed conversation",
				startTime: "2024-01-15T09:00:00Z",
				endTime: "2024-01-15T10:00:00Z",
				contents: [
					{
						content: "Detailed content",
						type: "text",
					},
				],
			};

			const mockResponse = {
				data: {
					lifelog: mockEntry,
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.getLifelog("entry_123");

			expect(mockAxiosInstance.get).toHaveBeenCalledWith("/v1/lifelogs/entry_123");
			expect(result).toEqual(mockEntry);
		});

		it("should handle 404 errors for non-existent entries", async () => {
			const errorResponse = {
				isAxiosError: true,
				response: {
					status: 404,
					data: { message: "Entry not found" },
				},
				message: "Request failed with status code 404",
			};

			// Mock axios.isAxiosError to return true for our error
			vi.mocked(axios.isAxiosError).mockReturnValue(true);
			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(client.getLifelog("non_existent")).rejects.toThrow(
				"Limitless API error (404): Entry not found"
			);
		});
	});

	describe("searchLifelogs", () => {
		it("should search lifelog entries and filter results", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "Planning discussion",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "This is about project planning",
									type: "text",
								},
							],
						},
						{
							id: "entry_2",
							title: "Other topic",
							startTime: "2024-01-15T11:00:00Z",
							endTime: "2024-01-15T12:00:00Z",
							contents: [
								{
									content: "Unrelated content",
									type: "text",
								},
							],
						},
					],
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.searchLifelogs({
				query: "project planning",
				limit: 5,
			});

			expect(result.data.lifelogs).toHaveLength(1);
			expect(result.data.lifelogs[0].id).toBe("entry_1");
		});

		it("should search in both content and title", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "Meeting summary",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "Some content",
									type: "text",
								},
							],
						},
					],
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.searchLifelogs({
				query: "meeting",
				limit: 5,
			});

			expect(result.data.lifelogs).toHaveLength(1);
		});

		it("should handle case-insensitive search", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "Discussion",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "PROJECT PLANNING session",
									type: "text",
								},
							],
						},
					],
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.searchLifelogs({
				query: "project planning",
				limit: 5,
			});

			expect(result.data.lifelogs).toHaveLength(1);
		});

		it("should return empty results when no matches found", async () => {
			const mockResponse: ListLifelogsResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "Different topic",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "Unrelated content",
									type: "text",
								},
							],
						},
					],
				},
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

			const result = await client.searchLifelogs({
				query: "nonexistent topic",
				limit: 5,
			});

			expect(result.data.lifelogs).toHaveLength(0);
		});
	});

	describe("error handling", () => {
		it("should handle unknown errors", async () => {
			vi.mocked(axios.isAxiosError).mockReturnValue(false);
			mockAxiosInstance.get.mockRejectedValue("unknown error");

			await expect(client.getLifelogs()).rejects.toThrow(
				"Limitless API error: unknown error"
			);
		});

		it("should handle axios errors without response", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Request timeout",
			};

			// Mock axios.isAxiosError to return true
			vi.mocked(axios.isAxiosError).mockReturnValue(true);
			mockAxiosInstance.get.mockRejectedValue(axiosError);

			await expect(client.getLifelogs()).rejects.toThrow(
				"Limitless API error (unknown): Request timeout"
			);
		});
	});
});