export class MinorCharacterState {
  constructor(data) {
    this.id = data.id;
    this.novelId = data.novel_id;
    this.name = data.name;
    this.role = data.role;
    this.status = data.status;
    this.description = data.description;
    this.items = data.items;
    this.attributes = data.attributes;
    this.firstAppearance = data.first_appearance;
    this.lastAppearance = data.last_appearance;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
