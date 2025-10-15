import { describe, it, expect } from "vitest";
import {
	LimitlessConfigSchema,
	LifelogEntrySchema,
	ListLifelogsParamsSchema,
	ListLifelogsResponseSchema,
	GetLifelogParamsSchema,
	SearchLifelogsParamsSchema,
	LimitlessErrorSchema,
} from "../src/limitless/types.js";

describe("Limitless Types", () => {
	describe("LimitlessConfigSchema", () => {
		it("should validate valid config", () => {
			const validConfig = {
				apiKey: "sk-test-123",
				baseUrl: "https://api.limitless.ai",
			};

			const result = LimitlessConfigSchema.parse(validConfig);
			expect(result).toEqual(validConfig);
		});

		it("should use default baseUrl", () => {
			const config = {
				apiKey: "sk-test-123",
			};

			const result = LimitlessConfigSchema.parse(config);
			expect(result.baseUrl).toBe("https://api.limitless.ai");
		});

		it("should reject empty apiKey", () => {
			const invalidConfig = {
				apiKey: "",
			};

			expect(() => LimitlessConfigSchema.parse(invalidConfig)).toThrow();
		});

		it("should reject invalid URL", () => {
			const invalidConfig = {
				apiKey: "sk-test-123",
				baseUrl: "not-a-url",
			};

			expect(() => LimitlessConfigSchema.parse(invalidConfig)).toThrow();
		});
	});

	describe("LifelogEntrySchema", () => {
		it("should validate valid lifelog entry", () => {
			const validEntry = {
				id: "entry_123",
				title: "Meeting about project planning",
				startTime: "2024-01-15T09:00:00Z",
				endTime: "2024-01-15T10:00:00Z",
				contents: [
					{
						content: "Discussion about project planning",
						type: "heading1",
					},
					{
						content: "Let's discuss the quarterly goals",
						type: "blockquote",
						speakerName: "John",
						startTime: "2024-01-15T09:00:00Z",
						endTime: "2024-01-15T09:01:00Z",
						startOffsetMs: 0,
						endOffsetMs: 60000,
					},
				],
				markdown: "# Discussion about project planning...",
				isStarred: true,
				updatedAt: "2024-01-15T10:05:00Z",
			};

			const result = LifelogEntrySchema.parse(validEntry);
			expect(result).toEqual(validEntry);
		});

		it("should validate minimal lifelog entry", () => {
			const minimalEntry = {
				id: "entry_123",
				title: "Basic conversation",
				startTime: "2024-01-15T09:00:00Z",
				endTime: "2024-01-15T10:00:00Z",
				contents: [
					{
						content: "Hello world",
						type: "text",
					},
				],
			};

			const result = LifelogEntrySchema.parse(minimalEntry);
			expect(result.isStarred).toBe(false); // default value
			expect(result).toMatchObject(minimalEntry);
		});

		it("should reject missing required fields", () => {
			const invalidEntry = {
				id: "entry_123",
				// missing title, startTime, endTime, contents
			};

			expect(() => LifelogEntrySchema.parse(invalidEntry)).toThrow();
		});
	});

	describe("ListLifelogsParamsSchema", () => {
		it("should validate valid params", () => {
			const validParams = {
				date: "2024-01-15",
				timezone: "America/Los_Angeles",
				start_time: "09:00:00",
				end_time: "17:00:00",
				cursor: "cursor_123",
				sort_direction: "desc" as const,
				limit: 5,
			};

			const result = ListLifelogsParamsSchema.parse(validParams);
			expect(result).toEqual(validParams);
		});

		it("should use default limit", () => {
			const params = {};

			const result = ListLifelogsParamsSchema.parse(params);
			expect(result.limit).toBe(10);
		});

		it("should reject invalid sort_direction", () => {
			const invalidParams = {
				sort_direction: "invalid",
			};

			expect(() => ListLifelogsParamsSchema.parse(invalidParams)).toThrow();
		});

		it("should reject limit outside valid range", () => {
			const invalidParams1 = { limit: 0 };
			const invalidParams2 = { limit: 11 };

			expect(() => ListLifelogsParamsSchema.parse(invalidParams1)).toThrow();
			expect(() => ListLifelogsParamsSchema.parse(invalidParams2)).toThrow();
		});
	});

	describe("ListLifelogsResponseSchema", () => {
		it("should validate valid response", () => {
			const validResponse = {
				data: {
					lifelogs: [
						{
							id: "entry_1",
							title: "First conversation",
							startTime: "2024-01-15T09:00:00Z",
							endTime: "2024-01-15T10:00:00Z",
							contents: [
								{
									content: "Hello",
									type: "text",
								},
							],
						},
						{
							id: "entry_2",
							title: "Second conversation",
							startTime: "2024-01-15T11:00:00Z",
							endTime: "2024-01-15T12:00:00Z",
							contents: [
								{
									content: "World",
									type: "text",
								},
							],
						},
					],
				},
				meta: {
					lifelogs: {
						count: 2,
					},
				},
			};

			const result = ListLifelogsResponseSchema.parse(validResponse);
			expect(result.data.lifelogs).toHaveLength(2);
			expect(result.data.lifelogs[0].id).toBe("entry_1");
			expect(result.data.lifelogs[1].id).toBe("entry_2");
			expect(result.meta?.lifelogs.count).toBe(2);
		});

		it("should validate minimal response", () => {
			const minimalResponse = {
				data: {
					lifelogs: [],
				},
			};

			const result = ListLifelogsResponseSchema.parse(minimalResponse);
			expect(result.data.lifelogs).toEqual([]);
			expect(result.meta).toBeUndefined();
		});
	});

	describe("GetLifelogParamsSchema", () => {
		it("should validate valid params", () => {
			const validParams = {
				lifelog_id: "entry_123",
			};

			const result = GetLifelogParamsSchema.parse(validParams);
			expect(result).toEqual(validParams);
		});

		it("should reject empty lifelog_id", () => {
			const invalidParams = {
				lifelog_id: "",
			};

			expect(() => GetLifelogParamsSchema.parse(invalidParams)).toThrow();
		});
	});

	describe("SearchLifelogsParamsSchema", () => {
		it("should validate valid search params", () => {
			const validParams = {
				query: "project planning",
				date_from: "2024-01-01",
				date_to: "2024-01-31",
				timezone: "America/Los_Angeles",
				cursor: "cursor_123",
				limit: 5,
			};

			const result = SearchLifelogsParamsSchema.parse(validParams);
			expect(result).toEqual(validParams);
		});

		it("should use default limit", () => {
			const params = {
				query: "test query",
			};

			const result = SearchLifelogsParamsSchema.parse(params);
			expect(result.limit).toBe(10);
		});

		it("should reject empty query", () => {
			const invalidParams = {
				query: "",
			};

			expect(() => SearchLifelogsParamsSchema.parse(invalidParams)).toThrow();
		});

		it("should reject limit outside valid range", () => {
			const invalidParams1 = { query: "test", limit: 0 };
			const invalidParams2 = { query: "test", limit: 11 };

			expect(() => SearchLifelogsParamsSchema.parse(invalidParams1)).toThrow();
			expect(() => SearchLifelogsParamsSchema.parse(invalidParams2)).toThrow();
		});
	});

	describe("LimitlessErrorSchema", () => {
		it("should validate error response", () => {
			const validError = {
				error: "ValidationError",
				message: "Invalid API key",
				status_code: 401,
			};

			const result = LimitlessErrorSchema.parse(validError);
			expect(result).toEqual(validError);
		});

		it("should reject missing required fields", () => {
			const invalidError = {
				error: "ValidationError",
				// missing message and status_code
			};

			expect(() => LimitlessErrorSchema.parse(invalidError)).toThrow();
		});
	});
});