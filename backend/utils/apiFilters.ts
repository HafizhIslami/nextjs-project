import { Document, Query } from "mongoose";

class APIFilters<T extends Document> {
  query: Query<T[], T>;
  queryStr: Record<string, string>;

  constructor(query: Query<T[], T>, queryStr: Record<string, string>) {
    this.query = query;
    this.queryStr = queryStr;
  }
  search(): APIFilters<T> {
    const location = this.queryStr?.location
      ? {
          address: {
            $regex: this.queryStr.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...location });

    return this;
  }

  filter(): APIFilters<T> {
    const queryCopy: Record<string, string | number> = {};

    if (["King", "Single", "Twins"].includes(this.queryStr.category)) {
      queryCopy.category = this.queryStr.category;
    }

    if (/^\d+$/.test(this.queryStr.guests || "")) {
      queryCopy.guestCapacity = Number(this.queryStr.guests);
    }

    this.query = this.query.find(queryCopy);

    return this;
  }

  pagination(resPerPage: number): APIFilters<T> {
    const parsedPage = Number(this.queryStr?.page);
    const currentPage = Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;
    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.limit(resPerPage).skip(skip);

    return this;
  }
}

export default APIFilters;
