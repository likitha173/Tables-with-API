import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Popconfirm,
  Button,
  Space,
  Form,
  Input,
  Typography,
  Pagination
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
const { Title } = Typography;

const APITable = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [sortedInfo, setSortedInfo] = useState({});
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [searchColText, setSearchColText] = useState("");
  const [searchedCol, setSearchedCol] = useState("");
  let [filteredInfo, setFilteredInfo] = useState({});
  let [filteredData] = useState();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const response = await axios.get(
      "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json"
    );
    setGridData(response.data);
    setLoading(false);
  };

  const handleDelete = (value) => {
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((item) => item.id !== value.id);
    setGridData(filteredData);
  };

  const modifiedData = gridData.map(({ body, ...item }) => ({
    ...item,
    key: item.id,
  }));

  console.log("modifiedData", modifiedData);

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 0, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleResetCol(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    render: (text) =>
      searchedCol === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchColText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchColText(selectedKeys[0]);
    setSearchedCol(dataIndex);
  };

  const handleResetCol = (clearFilters) => {
    clearFilters();
    setSearchColText("");
  };

  const edit = (record) => {
    form.setFieldsValue({
      name: "",
      email: "",
      comment: "",
      ...record,
    });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const handleChange = (_, filters, sorter) => {
    console.log("sorter", sorter);
    console.log("filters", filters);
    const { order, field } = sorter;
    setFilteredInfo(filters);
    setSortedInfo({ columnKey: field, order });
  };

  console.log("filteredInfo", filteredInfo);

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...modifiedData];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setGridData(newData);
        setEditingKey("");
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    record,
    children,
    ...restProps
  }) => {
    const input = <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0,
            }}
            rules={[
              {
                required: true,
                message: `Please input ${title}`,
              },
            ]}
          >
            {input}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      align: "center",
      editable: true,
      sorter: (a, b) => a.name.length - b.name.length,
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      ...getColumnSearchProps("name"),
    },
    {
      title: "Email",
      dataIndex: "email",
      align: "center",
      editable: true,
      sorter: (a, b) => a.email.length - b.email.length,
      sortOrder: sortedInfo.columnKey === "email" && sortedInfo.order,
      ...getColumnSearchProps("email"),
    },
    {
      title: "Role",
      dataIndex: "role",
      align: "center",
      editable: false,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      align: "center",
      render: (_, record) => {
        const editable = isEditing(record);
        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => handleDelete(record)}
            >
              <Button disabled={editable} danger>
                <FontAwesomeIcon icon={faTrash} color="" />
              </Button>
            </Popconfirm>
            {editable ? (
              <span>
                <Space size="middle">
                  <Button
                    onClick={(e) => save(record.key)}
                    type="primary"
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </Button>
                  <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                    <Button>Cancel</Button>
                  </Popconfirm>
                </Space>
              </span>
            ) : (
              <Button onClick={() => edit(record)}>
                <FontAwesomeIcon icon={faEdit} color="#0080FF" />
              </Button>
            )}
          </Space>
        ) : null;
      },
    },
  ];

  const isEditing = (record) => {
    return record.key === editingKey;
  };

  const clearAll = () => {
    setSortedInfo({});
    setFilteredInfo({});
    setSearchText("");
    loadData();
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const handleSearch = (e) => {
    setSearchText(e.target.value);
    if (e.target.value === "") {
      loadData();
    }
  };

  const globalSearch = () => {
    filteredData = modifiedData.filter((value) => {
      const name = (value.name || "").toLowerCase();
      const email = (value.email || "").toLowerCase();
      const comment = (value.comment || "").toLowerCase();

      return (
        name.includes(searchText.toLowerCase()) ||
        email.includes(searchText.toLowerCase()) ||
        comment.includes(searchText.toLowerCase())
      );
    });

    setGridData(filteredData);
  };

  return (
    <div>
      <Title
        level={3}
        style={{
          marginBottom: 0,
          marginTop: 10,
          fontSize: "35px",
          fontWeight: "bold",
        }}
      >
        Tables with AIP
      </Title>
      <Space style={{ margin: 20 }}>
        <Input
          placeholder="Enter Search Text"
          onChange={handleSearch}
          type="text"
          allowClear
          value={searchText}
        />
        <Button type="primary" onClick={globalSearch}>
          Search
        </Button>
        <Button onClick={clearAll}>Clear All</Button>
      </Space>
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          columns={mergedColumns}
          dataSource={
            filteredData && filteredData.length ? filteredData : modifiedData
          }
          bordered
          loading={loading}
          onChange={handleChange}
          size="small"
          pagination={{
            position: ['bottomCenter'],
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '30', '40'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Form>
    </div>
  );
};

export default APITable;