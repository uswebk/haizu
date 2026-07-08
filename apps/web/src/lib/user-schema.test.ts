import { LoginInputSchema, SignUpInputSchema } from "@haizu/shared";
import { describe, expect, it } from "vitest";

const validSignUp = {
	name: "山田太郎",
	companyName: "haizu株式会社",
	email: "taro@example.com",
	password: "password1",
};

describe("SignUpInputSchema", () => {
	it("正常な入力を受け入れる", () => {
		expect(SignUpInputSchema.safeParse(validSignUp).success).toBe(true);
	});

	it("name が空だと拒否する", () => {
		expect(
			SignUpInputSchema.safeParse({ ...validSignUp, name: "" }).success,
		).toBe(false);
	});

	it("companyName が空だと拒否する", () => {
		expect(
			SignUpInputSchema.safeParse({ ...validSignUp, companyName: "" }).success,
		).toBe(false);
	});

	it("不正なメールアドレスを拒否する", () => {
		expect(
			SignUpInputSchema.safeParse({ ...validSignUp, email: "not-an-email" })
				.success,
		).toBe(false);
	});

	it("パスワードが8文字未満だと拒否する", () => {
		expect(
			SignUpInputSchema.safeParse({ ...validSignUp, password: "pass1" })
				.success,
		).toBe(false);
	});
});

describe("LoginInputSchema", () => {
	it("正常な入力を受け入れる", () => {
		expect(
			LoginInputSchema.safeParse({
				email: "taro@example.com",
				password: "x",
			}).success,
		).toBe(true);
	});

	it("不正なメールアドレスを拒否する", () => {
		expect(
			LoginInputSchema.safeParse({ email: "bad", password: "x" }).success,
		).toBe(false);
	});

	it("パスワードが空だと拒否する", () => {
		expect(
			LoginInputSchema.safeParse({ email: "taro@example.com", password: "" })
				.success,
		).toBe(false);
	});
});
