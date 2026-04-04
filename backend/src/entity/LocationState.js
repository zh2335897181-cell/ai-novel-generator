export class LocationState {
  constructor(data) {
    this.id = data.id;
    this.novelId = data.novel_id;
    this.name = data.name;
    this.type = data.type;
    this.status = data.status;
    this.description = data.description;
    this.attributes = data.attributes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
