"use client";

import { IUser } from "@/backend/models/user";
import { useDeleteUserMutation } from "@/redux/api/userApi";
import SimpleDataTable, { DataTableData } from "./SimpleDataTable";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

interface Props {
  data: {
    users: IUser[];
  };
}

const AllUsers = ({ data }: Props) => {
  const users = data?.users;

  const router = useRouter();

  const [deleteUser, { error, isLoading, isSuccess }] = useDeleteUserMutation();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      router.refresh();
      toast.success("User deleted");
    }
  }, [error, isSuccess, router]);

  const setUsers = () => {
    const data: DataTableData = {
      columns: [
        {
          label: "ID",
          field: "id",
          sort: "asc",
        },
        {
          label: "Name",
          field: "name",
          sort: "asc",
        },
        {
          label: "Email",
          field: "email",
          sort: "asc",
        },
        {
          label: "Role",
          field: "role",
          sort: "asc",
        },
        {
          label: "Actions",
          field: "actions",
          sort: "asc",
        },
      ],
      rows: [],
    };

    users?.forEach((user) => {
      data?.rows?.push({
        id: user._id?.toString(),
        name: user?.name,
        email: user?.email,
        role: user?.role,
        actions: (
          <div className="table-actions">
            <Link
              href={`/admin/users/${user._id}`}
              className="btn btn-outline-primary btn-sm"
            >
              Edit
            </Link>

            <button
              className="btn btn-outline-danger btn-sm"
              disabled={isLoading}
              onClick={() => deleteUserHandler(user?._id?.toString() ?? "")}
            >
              Delete
            </button>
          </div>
        ),
      });
    });

    return data;
  };

  const deleteUserHandler = (id: string) => {
    if (window.confirm("Delete this user? This action cannot be undone.")) {
      deleteUser(id);
    }
  };

  return (
    <div className="container">
      <h2 className="resource-title">{users?.length} User(s)</h2>
      <SimpleDataTable data={setUsers()} className="px-3" />
    </div>
  );
};

export default AllUsers;
