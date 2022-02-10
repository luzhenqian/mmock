import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import Button from 'primevue/button'
import Tree from 'primevue/tree'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Textarea from 'primevue/textarea';
import ToastService from 'primevue/toastservice';
import Toast from 'primevue/toast';
import ContextMenu from 'primevue/contextmenu';
import SpeedDial from "primevue/speeddial"
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.css'
import 'primeicons/primeicons.css'
import App from './App.vue'

const app = createApp(App)

app.use(PrimeVue, {ripple: true});
app.component('Button', Button);
app.component('Tree', Tree);
app.component('Dialog', Dialog);
app.component('InputText', InputText);
app.component('Dropdown', Dropdown);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Textarea', Textarea);
app.component('Toast', Toast);
app.component('ContextMenu', ContextMenu);
app.component('SpeedDial', SpeedDial);
app.use(ToastService)

app.mount('#app')
