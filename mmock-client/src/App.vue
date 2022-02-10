<template>
  <div class="container">
    <div class="projects-menu">
      <Button @click="createProject">创建项目</Button>
      <div class="projects-warpper">
        <Tree
          v-if="projects.length > 0"
          @node-select="apiSelect"
          :value="projects"
          :expandedKeys="expandedKeys"
          selectionMode="single"
        >
          <template #default="slotProps">
            <div @contextmenu="(e) => onMenuRightClick(e, slotProps.node)">
              {{ slotProps.node.label }}
            </div>
          </template>
        </Tree>
        <div v-else>暂无项目</div>
      </div>
    </div>

    <div class="config-warpper">
      <div class="base-config-warpper">
        <div>
          <span class="label">Method</span>
          <Dropdown
            v-model="method"
            :options="methods"
            optionLabel="name"
            placeholder="选择一种请求方式"
          />
        </div>
        <div>
          <span class="label">Url</span>
          <InputText v-model="url" placeholder="请输入 URL" />
        </div>
      </div>

      <div>
        <div class="label">查询参数 Query Parameters</div>
        <Button
          label="添加新的参数"
          icon="pi pi-plus"
          class="p-button-success mr-2"
          @click="addQueryParams"
        />
        <DataTable
          :value="queryParameters"
          v-model:selection="selectedQueryParams"
          responsiveLayout="scroll"
          editMode="cell"
          @cell-edit-complete="onCellEditComplete"
          data-key="id"
          :metaKeySelection="false"
        >
          <Column selectionMode="multiple" headerStyle="width: 3em"></Column>
          <Column class="col" bodyClass="col" field="name" header="Name">
            <template #editor="{ data, field }">
              <InputText
                v-model="data[field]"
                autofocus
                placeholder="请输入key名"
              />
            </template>
          </Column>
          <Column class="col" bodyClass="col" field="value" header="Value">
            <template #editor="{ data, field }">
              <InputText
                v-model="data[field]"
                autofocus
                placeholder="请输入值"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div>
        <div class="label">请求头 headers</div>
        <Textarea v-model="headers" :autoResize="true" rows="5" cols="30" />
      </div>

      <div>
        <div class="label">响应体 body</div>
        <PrismEditor
          class="editor"
          v-model="body"
          :highlight="highlighter"
          line-numbers
        ></PrismEditor>
      </div>

      <Button @click="saveRequest">保存</Button>
    </div>
  </div>

  <Dialog header="创建项目" v-model:visible="display">
    <InputText label="项目名称" v-model="projectName"></InputText>
    <template #footer>
      <Button
        class="p-button-secondary"
        label="取消"
        @click="cancelCreateProject"
      />
      <Button label="创建" @click="createProjectSubmit" autofocus />
    </template>
  </Dialog>

  <Dialog header="创建服务" v-model:visible="createServiceDisplay">
    <InputText label="服务名称" v-model="serviceName"></InputText>
    <template #footer>
      <Button
        class="p-button-secondary"
        label="取消"
        @click="cancelCreateService"
      />
      <Button label="创建" @click="createServiceSubmit" autofocus />
    </template>
  </Dialog>

  <Dialog header="创建接口" v-model:visible="createRequestDisplay">
    <div>
      <label class="form-label">接口名称</label>
      <InputText v-model="requestForm.requestName"></InputText>
    </div>
    <div>
      <label class="form-label">method</label>
      <Dropdown
        v-model="requestForm.method"
        :options="methods"
        optionLabel="name"
        placeholder="选择一种请求方式"
      />
    </div>
    <div>
      <label class="form-label">url</label>
      <InputText v-model="requestForm.url"></InputText>
    </div>
    <div>
      <label class="form-label">body</label>
      <PrismEditor
        class="editor"
        v-model="requestForm.body"
        :highlight="highlighter"
        line-numbers
      ></PrismEditor>
    </div>
    <template #footer>
      <Button
        class="p-button-secondary"
        label="取消"
        @click="cancelCreateRequest"
      />
      <Button label="创建" @click="createRequestSubmit" autofocus />
    </template>
  </Dialog>

  <Toast />

  <ContextMenu ref="projectContextMenuRef" :model="projectContextMenu">
    <template #item="{ item }">
      <div class="contextmenu-item" @click="item.onClick">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </template>
  </ContextMenu>
  <ContextMenu ref="serviceContextMenuRef" :model="serviceContextMenu">
    <template #item="{ item }">
      <div class="contextmenu-item" @click="item.onClick">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </template>
  </ContextMenu>
  <ContextMenu ref="requestContextMenuRef" :model="requestContextMenu">
    <template #item="{ item }">
      <div class="contextmenu-item" @click="item.onClick">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </template>
  </ContextMenu>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
// import Prism Editor
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";
import { useToast } from "primevue/usetoast";
const defaultBody = `{
  "key": "value" 
}`;
const highlighter = (code: string) => {
  return highlight(code, languages.js); // languages.<insert language> to return html with markup
};

const projectContextMenuRef = ref();
const serviceContextMenuRef = ref();
const requestContextMenuRef = ref();
const projectContextMenu = [
  {
    label: "创建服务",
    icon: "pi pi-fw pi-inbox",
    onClick: function () {
      createService();
    },
  },
  { label: "重命名", icon: "pi pi-fw pi-inbox" },
  { label: "删除项目", icon: "pi pi-fw pi-inbox", onClick: deleteProject },
];
const serviceContextMenu = [
  {
    label: "创建接口",
    icon: "pi pi-fw pi-inbox",
    onClick: function () {
      createRequest();
    },
  },
  { label: "重命名", icon: "pi pi-fw pi-inbox" },
  { label: "删除服务", icon: "pi pi-fw pi-inbox", onClick: deleteService },
];
const requestContextMenu = [
  { label: "重命名", icon: "pi pi-fw pi-inbox" },
  { label: "删除接口", icon: "pi pi-fw pi-inbox", onClick: deleteRequest },
];

const display = ref(false);
const projectName = ref("");
const serviceName = ref("");
const requestForm = reactive({
  requestName: "",
  method: "",
  url: "",
  queryParameters: {},
  headers: {},
  body: defaultBody,
});
const methods = [
  { name: "get", code: "get" },
  { name: "post", code: "post" },
  { name: "put", code: "put" },
  { name: "delete", code: "delete" },
];
const method = ref(methods[0]);
const url = ref("/");

const createProject = () => {
  display.value = true;
};
const cancelCreateProject = () => {
  display.value = false;
};

const toast = useToast();
const createProjectSubmit = async () => {
  if (projectName.value === "") {
    toast.add({
      severity: "warn",
      summary: "创建失败",
      detail: "项目名称不能为空",
      life: 3000,
    });
    return;
  }
  const data = await fetch("http://localhost:3333/projects", {
    method: "post",
    body: JSON.stringify({ projectName: projectName.value }),
    headers: { "Content-Type": "application/json" },
  });
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    display.value = false;

    getProjectsData();
  }
};

const createServiceDisplay = ref(false);
const createService = () => {
  createServiceDisplay.value = true;
};
const cancelCreateService = () => {
  createServiceDisplay.value = false;
};
const createServiceSubmit = async () => {
  const data = await fetch("http://localhost:3333/services", {
    method: "post",
    body: JSON.stringify({
      projectName: projectName.value,
      serviceName: serviceName.value,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    createServiceDisplay.value = false;

    getProjectsData();
  }
};

async function deleteProject() {
  const data = await fetch(
    "http://localhost:3333/projects/" + curNodeData.key,
    {
      method: "delete",
      body: JSON.stringify({
        projectName: projectName.value,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    projectContextMenuRef.value.hide();

    getProjectsData();
  }
}

async function deleteService() {
  const data = await fetch(
    "http://localhost:3333/services/",
    {
      method: "delete",
      body: JSON.stringify({
        projectName: projectName.value,
        serviceName: serviceName.value,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    serviceContextMenuRef.value.hide();

    getProjectsData();
  }
}

async function deleteRequest() {
  console.log(curNodeData,'curNodeData')
  const data = await fetch(
    "http://localhost:3333/requests/",
    {
      method: "delete",
      body: JSON.stringify({
        projectName: curNodeData.projectName,
        serviceName: curNodeData.serviceName,
        requestName: curNodeData.key,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    requestContextMenuRef.value.hide();

    getProjectsData();
  }
}

const createRequestDisplay = ref(false);
const createRequest = () => {
  createRequestDisplay.value = true;
};
const cancelCreateRequest = () => {
  createRequestDisplay.value = false;
};
const createRequestSubmit = async () => {
  const data = await fetch("http://localhost:3333/requests", {
    method: "post",
    body: JSON.stringify({
      projectName: projectName.value,
      serviceName: serviceName.value,
      ...requestForm,
      method: (requestForm.method as any).code,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (data.ok) {
    const { message } = await data.json();
    toast.add({ severity: "info", summary: message, life: 3000 });
    createRequestDisplay.value = false;

    getProjectsData();
  }
};

const apiSelect = (node: any) => {
  if (node.type === "request") {
    const _method = methods.find(
      (method) => method.code === node.config.method
    );
    if (_method) method.value = _method;
    url.value = node.config.url;
    body.value = node.config.body;
  }

  curNodeData = node;
};

const projects = ref([]);

const expandedKeys = reactive(["0"]);

const queryParameters = reactive([{ id: "0", name: "key", value: "value" }]);

const selectedQueryParams = ref([]);

const onCellEditComplete = (event: any) => {
  let { data, newValue, field } = event;
  data[field] = newValue;
};

const addQueryParams = () => {
  queryParameters.push({
    id: Number(queryParameters[queryParameters.length - 1].id) + 1 + "",
    name: "",
    value: "",
  });
};

const headers = ref("");
const body = ref("");

function dataMap(raw: any) {
  return raw.map((data: any) => {
    const { _id, name, services } = data;
    return {
      key: _id,
      label: name,
      data: "Documents Folder",
      icon: "pi pi-fw pi-inbox",
      type: "project",
      children: serviceMap(services, name),
    };
  });
}

function serviceMap(raw: any, projectName: string) {
  return raw.map((data: any) => {
    const { name, requests } = data;
    return {
      key: name,
      label: name,
      type: "service",
      icon: "pi pi-fw pi-list",
      data: "adasf",
      projectName,
      children: requestMap(requests, projectName, name),
    };
  });
}

function requestMap(raw: any, projectName: string, serviceName: string) {
  return raw.map((data: any) => {
    const { name, url, method, body } = data;
    return {
      key: name,
      label: name,
      type: "request",
      icon: "pi pi-fw pi-telegram",
      data: "adasf",
      config: {
        url,
        method,
        body,
      },
      serviceName,
      projectName,
    };
  });
}

async function getProjectsData() {
  const data = await (await fetch("http://localhost:3333/projects")).json();
  projects.value = dataMap(data);
}

onMounted(async () => {
  await getProjectsData();
});

let curNodeData: any;
const onMenuRightClick = (event: any, data: any) => {
  curNodeData = data;
  if (data.type == "project") {
    projectName.value = data.label;
    return projectContextMenuRef.value.show(event);
  }
  if (data.type == "service") {
    projectName.value = data.projectName;
    serviceName.value = data.label;
    return serviceContextMenuRef.value.show(event);
  }
  if (data.type == "request") {
    return requestContextMenuRef.value.show(event);
  }
};

async function saveRequest() {
  console.log("curNodeData", curNodeData);
  const bodyData = {
    projectName: curNodeData.projectName,
    serviceName: curNodeData.serviceName,
    requestName: curNodeData.key,
    method: method.value.code,
    url: url.value,
    body: body.value,
  };

  const data = await (
    await fetch("http://localhost:3333/requests", {
      method: "put",
      body: JSON.stringify(bodyData),
      headers: { "Content-Type": "application/json" },
    })
  ).json();
  console.log("data:", data);
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}

.p-button {
  background-color: #327bf0 !important;
  color: #ffffff !important;
}

.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #121316;
  color: #ffffff;
  .projects-menu {
    width: 300px;
    background-color: #1b1c21;
    padding: 24px;

    .projects-warpper {
      margin-top: 24px;
    }
  }
  .config-warpper {
    flex: 1;
    padding: 24px;
    overflow: auto;

    & > * {
      margin-bottom: 18px;
    }
    .base-config-warpper {
      display: flex;
      .label {
        display: inline-block;
        margin-right: 12px;

        font-size: 18px;
        font-weight: 600;
      }
      .p-dropdown {
        width: 200px;
      }
      & > * {
        margin-right: 24px;
      }
    }
    .col {
      /* width: 200px; */
    }
    .label {
      font-size: 18px;
      font-weight: 600;
      margin: 12px 0;
    }
  }
}

.contextmenu-item {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  /* &:last-child{
    border-bottom: none;
  } */

  & > i {
    margin-right: 12px;
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.67);
    color: #fff;
  }
}

.form-label {
  width: 100px;
  display: inline-block;
  margin-right: 12px;
}

.editor {
  border: 1px solid rebeccapurple;
  padding: 12px 0;
}
</style>
<!-- DsGgkcKDzDuUt3SI -->
