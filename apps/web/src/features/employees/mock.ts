import type { EmployeeRow } from "./types";

const AVATAR_COLORS = [
	"#2f8fd6",
	"#3d9970",
	"#f0883e",
	"#8b5cf6",
	"#26a69a",
	"#e85d75",
	"#d4a017",
	"#ef6c5a",
];

const TAG_POOL = [
	"製造ライン",
	"リーダー",
	"検査",
	"梱包",
	"物流",
	"フォークリフト",
];

const LAST_NAMES = [
	"田中",
	"高橋",
	"中村",
	"佐藤",
	"林",
	"渡辺",
	"斎藤",
	"鈴木",
	"伊藤",
	"山本",
	"加藤",
	"吉田",
	"小林",
	"松本",
	"井上",
	"木村",
	"清水",
	"山田",
	"森田",
	"石井",
];

const FIRST_NAMES = [
	"太郎",
	"実",
	"健",
	"花子",
	"美咲",
	"涼",
	"樹",
	"翔太",
	"愛子",
	"陽菜",
	"大輔",
	"優",
	"あかり",
	"さくら",
	"拓也",
	"結衣",
	"直樹",
	"恵",
	"誠",
	"由美",
];

function tagsFor(index: number): string[] {
	const count = 1 + (index % 3);
	const tags: string[] = [];
	for (let i = 0; i < count; i++) {
		const tag = TAG_POOL[(index + i * 2) % TAG_POOL.length];
		if (!tags.includes(tag)) tags.push(tag);
	}
	return tags;
}

function generateEmployees(count: number): EmployeeRow[] {
	return Array.from({ length: count }, (_, i) => {
		const n = i + 1;
		return {
			id: `e${n}`,
			code: `EMP-${String(n).padStart(3, "0")}`,
			lastName: LAST_NAMES[i % LAST_NAMES.length],
			firstName: FIRST_NAMES[i % FIRST_NAMES.length],
			avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
			site: "A工場",
			tags: tagsFor(i),
			isActive: n % 7 !== 0,
		};
	});
}

export const MOCK_EMPLOYEES: EmployeeRow[] = generateEmployees(120);
