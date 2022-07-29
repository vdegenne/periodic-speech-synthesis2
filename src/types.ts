export type InterfaceType = 'main'|'project';

export type Item = {
  v: string;
  a: boolean;
}

export type Project = {
  name: string;
  items: Item[];
  creationDate: number;
  updateDate: number;
}