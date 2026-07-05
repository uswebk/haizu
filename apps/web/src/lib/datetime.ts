// 日付・時刻のフォーマット/変換ユーティリティ（アプリ内で散らばらないよう集約する）

const JP_WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad2 = (n: number) => String(n).padStart(2, "0");

// Date → "YYYY-MM-DD"（ローカル日付）
export function toDateStr(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// 今日の "YYYY-MM-DD"
export function todayStr(): string {
	return toDateStr(new Date());
}

// 前日の "YYYY-MM-DD"
export function yesterdayStr(): string {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return toDateStr(d);
}

// "YYYY-MM-DD" → "YYYY/M/D（曜）"
export function formatDateLabel(date: string): string {
	const d = new Date(`${date}T00:00:00`);
	return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${JP_WEEK[d.getDay()]}）`;
}

// Date → "YYYY/M/D（曜） HH:MM:SS"
export function formatClock(d: Date): string {
	const date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${JP_WEEK[d.getDay()]}）`;
	const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
	return `${date} ${time}`;
}

// "HH:MM" → 0時からの経過分
export function hmToMinutes(hhmm: string): number {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}
