import { createFileRoute } from "@tanstack/react-router";
import { Slot } from "#/components/domain/Slot";
import { ZoneFrame } from "#/components/domain/ZoneFrame";
import { Avatar } from "#/components/ui/Avatar";
import type { Person } from "#/components/ui/AvatarStack";
import { AvatarStack } from "#/components/ui/AvatarStack";
import { Badge } from "#/components/ui/Badge";
import { Button } from "#/components/ui/Button";
import { Card } from "#/components/ui/Card";
import { EmptyState } from "#/components/ui/EmptyState";
import { IconButton } from "#/components/ui/IconButton";
import { Input } from "#/components/ui/Input";
import { NavItem } from "#/components/ui/NavItem";
import { RoleBadge } from "#/components/ui/RoleBadge";
import { Select } from "#/components/ui/Select";
import { Table } from "#/components/ui/Table";

export const Route = createFileRoute("/catalog")({ component: Catalog });

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mb-12">
			<h2 className="font-mono text-[11px] font-bold tracking-[.14em] uppercase text-faint m-0 mb-5 pb-2.5 border-b border-hairline">
				{title}
			</h2>
			<div className="flex flex-wrap gap-3 items-start">{children}</div>
		</section>
	);
}

function Demo({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="font-mono text-[11px] text-faint mb-1.5">{label}</div>
			{children}
		</div>
	);
}

const PEOPLE: Person[] = [
	{ id: "1", name: "田中", color: "var(--color-avatar-1)" },
	{ id: "2", name: "高橋", color: "var(--color-avatar-2)" },
	{ id: "3", name: "中村", color: "var(--color-avatar-3)" },
	{ id: "4", name: "山本", color: "var(--color-avatar-4)" },
	{ id: "5", name: "林", color: "var(--color-avatar-5)" },
	{ id: "6", name: "森", color: "var(--color-avatar-6)" },
];

const TABLE_COLS = [
	{ key: "name", label: "名前", width: "2fr" },
	{ key: "site", label: "拠点", width: "1fr", muted: true },
	{ key: "role", label: "役割", width: "1fr" },
];
const TABLE_ROWS = [
	{ name: "田中 誠", site: "A工場", role: "管理者" },
	{ name: "高橋 麻衣", site: "B倉庫", role: "現場リーダー" },
	{ name: "中村 健一", site: "A工場", role: "一般スタッフ" },
];

function Catalog() {
	return (
		<div className="min-h-screen bg-app-bg px-16 py-12 font-sans">
			<div style={{ maxWidth: 900 }}>
				<div className="mb-12">
					<h1 className="text-[26px] font-bold text-ink m-0 mb-1.5">
						haiz コンポーネントカタログ
					</h1>
					<p className="text-muted text-sm m-0">Design System — 案A ティール</p>
				</div>

				<Section title="Avatar">
					<Demo label="size=40 (default)">
						<Avatar name="田中" />
					</Demo>
					<Demo label="size=28">
						<Avatar name="高橋" size={28} />
					</Demo>
					<Demo label="size=56">
						<Avatar name="中村" size={56} />
					</Demo>
					<Demo label="ring=true">
						<Avatar name="山本" ring />
					</Demo>
					<Demo label="color override">
						<Avatar name="林" color="#8b5cf6" />
					</Demo>
				</Section>

				<Section title="AvatarStack">
					<Demo label="3人">
						<AvatarStack
							people={[
								{ id: "1", name: "田中", color: "var(--color-avatar-1)" },
								{ id: "2", name: "高橋", color: "var(--color-avatar-2)" },
								{ id: "3", name: "中村", color: "var(--color-avatar-3)" },
							]}
						/>
					</Demo>
					<Demo label="6人 max=4 (+2)">
						<AvatarStack people={PEOPLE} max={4} />
					</Demo>
					<Demo label="size=28">
						<AvatarStack people={PEOPLE} size={28} />
					</Demo>
				</Section>

				<Section title="Badge">
					<Demo label="draft">
						<Badge tone="draft">下書き</Badge>
					</Demo>
					<Demo label="primary">
						<Badge tone="primary">A工場</Badge>
					</Demo>
					<Demo label="success">
						<Badge tone="success">稼働中</Badge>
					</Demo>
					<Demo label="warning">
						<Badge tone="warning">調整中</Badge>
					</Demo>
					<Demo label="danger">
						<Badge tone="danger">停止</Badge>
					</Demo>
				</Section>

				<Section title="Button">
					<Demo label="primary/md">
						<Button>配置を開く</Button>
					</Demo>
					<Demo label="secondary/md">
						<Button variant="secondary">下書き保存</Button>
					</Demo>
					<Demo label="danger/md">
						<Button variant="danger">削除</Button>
					</Demo>
					<Demo label="ghost/md">
						<Button variant="ghost">キャンセル</Button>
					</Demo>
					<Demo label="primary/sm">
						<Button size="sm">確定する</Button>
					</Demo>
					<Demo label="secondary/sm">
						<Button size="sm" variant="secondary">
							編集
						</Button>
					</Demo>
					<Demo label="disabled">
						<Button disabled>配置を開く</Button>
					</Demo>
				</Section>

				<Section title="IconButton">
					<Demo label="default">
						<IconButton label="追加">＋</IconButton>
					</Demo>
					<Demo label="active">
						<IconButton label="フィルタ" active>
							⚙
						</IconButton>
					</Demo>
					<Demo label="size=28">
						<IconButton label="閉じる" size={28}>
							✕
						</IconButton>
					</Demo>
				</Section>

				<Section title="RoleBadge">
					<Demo label="admin">
						<RoleBadge role="admin" />
					</Demo>
					<Demo label="site">
						<RoleBadge role="site" />
					</Demo>
					<Demo label="general">
						<RoleBadge role="general" />
					</Demo>
					<Demo label="other">
						<RoleBadge role="other" />
					</Demo>
				</Section>

				<Section title="Input">
					<Demo label="no label">
						<Input placeholder="検索…" width={220} />
					</Demo>
					<Demo label="with label">
						<Input label="拠点名" placeholder="A工場" width={220} />
					</Demo>
				</Section>

				<Section title="Select">
					<Demo label="no label">
						<Select
							options={["製造ライン", "倉庫", "食品センター"]}
							width={200}
						/>
					</Demo>
					<Demo label="with label">
						<Select
							label="拠点種別"
							options={[
								{ value: "manufacturing", label: "製造ライン" },
								{ value: "warehouse", label: "倉庫" },
								{ value: "food", label: "食品センター" },
							]}
							width={200}
						/>
					</Demo>
				</Section>

				<Section title="NavItem">
					<Demo label="inactive">
						<NavItem>拠点一覧</NavItem>
					</Demo>
					<Demo label="active">
						<NavItem active>配置エディタ</NavItem>
					</Demo>
				</Section>

				<Section title="Card">
					<Demo label="simple">
						<Card title="A工場" style={{ width: 280 }}>
							<div className="text-muted text-[13px]">製造ライン</div>
						</Card>
					</Demo>
					<Demo label="with status">
						<Card
							title="B倉庫"
							status={<Badge tone="success">稼働中</Badge>}
							style={{ width: 280 }}
						>
							<AvatarStack
								people={[
									{ id: "1", name: "田中", color: "var(--color-avatar-1)" },
									{ id: "2", name: "高橋", color: "var(--color-avatar-2)" },
									{ id: "3", name: "中村", color: "var(--color-avatar-3)" },
								]}
							/>
						</Card>
					</Demo>
					<Demo label="with footer">
						<Card
							title="C食品センター"
							status={<Badge tone="warning">調整中</Badge>}
							footer={<Button size="sm">配置を開く</Button>}
							style={{ width: 280 }}
						>
							<div className="text-[13px] text-muted">定員 18 ・ 配置 12</div>
						</Card>
					</Demo>
				</Section>

				<Section title="EmptyState">
					<Demo label="no action">
						<EmptyState
							title="配置履歴なし"
							hint="配置を確定するとここに記録されます"
							style={{ width: 340 }}
						/>
					</Demo>
					<Demo label="with action">
						<EmptyState
							title="従業員が見つかりません"
							hint="検索条件を変えてお試しください"
							action={<Button size="sm">条件をリセット</Button>}
							style={{ width: 340 }}
						/>
					</Demo>
				</Section>

				<Section title="Table">
					<Table
						columns={TABLE_COLS}
						rows={TABLE_ROWS}
						rowKey={(row) => row.name}
						style={{ width: 520 }}
					/>
				</Section>

				<Section title="Slot (domain)">
					<Demo label="empty">
						<Slot title="ライン①" capacity={4} people={[]} />
					</Demo>
					<Demo label="partial">
						<Slot
							title="ライン②"
							capacity={4}
							people={[
								{ id: "1", name: "田中", color: "var(--color-avatar-1)" },
								{ id: "2", name: "高橋", color: "var(--color-avatar-2)" },
							]}
						/>
					</Demo>
					<Demo label="full">
						<Slot
							title="検査"
							capacity={2}
							people={[
								{ id: "3", name: "中村", color: "var(--color-avatar-3)" },
								{ id: "4", name: "山本", color: "var(--color-avatar-4)" },
							]}
						/>
					</Demo>
				</Section>

				<Section title="ZoneFrame (domain)">
					<ZoneFrame label="製造ゾーン" style={{ width: 460 }}>
						<div className="flex gap-3">
							<Slot
								title="ライン①"
								capacity={4}
								people={[
									{ id: "1", name: "田中", color: "var(--color-avatar-1)" },
									{ id: "2", name: "高橋", color: "var(--color-avatar-2)" },
								]}
							/>
							<Slot title="ライン②" capacity={4} people={[]} />
						</div>
					</ZoneFrame>
				</Section>

				<Section title="Typography">
					<div style={{ width: "100%" }}>
						{(
							[
								["Display (34px)", "34px", 700],
								["H1 (26px)", "26px", 700],
								["H2 (20px)", "20px", 600],
								["H3 (16px)", "16px", 500],
								["Body (14px)", "14px", 400],
								["Small (13px)", "13px", 400],
								["Caption (11.5px)", "11.5px", 400],
							] as [string, string, number][]
						).map(([label, size, weight]) => (
							<div key={label} className="flex items-baseline gap-5 mb-2">
								<span
									className="font-mono text-[11px] text-faint shrink-0"
									style={{ width: 180 }}
								>
									{label}
								</span>
								<span style={{ fontSize: size, fontWeight: weight }}>
									haizで現場を最適化する
								</span>
							</div>
						))}
						<div className="mt-4 flex items-baseline gap-5">
							<span
								className="font-mono text-[11px] text-faint shrink-0"
								style={{ width: 180 }}
							>
								Mono label (11.5px)
							</span>
							<span className="font-mono font-semibold text-[11.5px] tracking-[.04em]">
								定員 24 ・ 配置 18
							</span>
						</div>
					</div>
				</Section>

				<Section title="Color tokens">
					{(
						[
							["--color-primary", "#0ea5a4"],
							["--color-primary-hover", "#0c8e8d"],
							["--color-primary-soft", "#dcf2f0"],
							["--color-ink", "#1d2a3a"],
							["--color-muted", "#6b7a8d"],
							["--color-faint", "#9aabc1"],
							["--color-border", "#e2e9f3"],
							["--color-hairline", "#eef2f8"],
							["--color-success", "#16a34a"],
							["--color-warning", "#e07b1a"],
							["--color-danger", "#e5484d"],
						] as [string, string][]
					).map(([name, hex]) => (
						<div key={name} className="flex items-center gap-2.5">
							<div
								className="w-8 h-8 rounded-sm shrink-0 border border-border"
								style={{ background: `var(${name})` }}
							/>
							<div>
								<div className="font-mono text-xs text-ink">{name}</div>
								<div className="text-[11px] text-faint">{hex}</div>
							</div>
						</div>
					))}
				</Section>
			</div>
		</div>
	);
}
