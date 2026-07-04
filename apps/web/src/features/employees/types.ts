export type EmployeeTag = {
	id: string;
	name: string;
};

export type EmployeeRow = {
	id: string;
	code: string;
	lastName: string;
	firstName: string;
	avatarColor: string;
	tags: EmployeeTag[];
	isActive: boolean;
};
