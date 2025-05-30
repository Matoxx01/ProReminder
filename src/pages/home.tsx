import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonImg,
  IonMenu,
  IonItem,
  IonToggle,
  IonCheckbox,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonLabel,
  IonToolbar,
  IonList,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonReorder,
  IonReorderGroup,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonMenuToggle
} from '@ionic/react';
import { add, funnel, chevronBack } from 'ionicons/icons';
import { Storage } from '@ionic/storage';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useHistory } from 'react-router-dom';
import { menuController } from '@ionic/core';
import './home.css';

interface Reminder {
  title: string;
  desc?: string;
  datetime: string;
  emoji: string;
  alarm?: string;
  id: string;
}

interface Filters { 
  max: boolean; 
  med: boolean; 
  min: boolean; 
  custom: boolean; 
}

const STORAGE_REMINDERS = 'reminders';
const STORAGE_FILTERS = 'filters';
const STORAGE_EXTRAREMINDERS = 'extrareminders';

const Home: React.FC = () => {
  const history = useHistory();
  const [storage, setStorage] = useState<Storage>();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportAlert, setShowExportAlert] = useState(false);
  const [showImportAlert, setShowImportAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editIndex, setEditIndex] = useState<number>();

  // Form state for Add/Edit
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priorityEmoji, setPriorityEmoji] = useState('');
  const [alarm, setAlarm] = useState<string>();
  const [useAlarm, setUseAlarm] = useState(false);

  // Data
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filters, setFilters] = useState<Filters>({ max: true, med: true, min: true, custom: false });

  // Función para ir a About Us
  const handleAboutUs = async () => {
    await menuController.close();
    history.push('/aboutus/aboutus');
  };

  // Función para mostrar Export Alert
  const handleShowExportAlert = async () => {
    await menuController.close();
    setShowExportAlert(true);
  };

  // Función para mostrar Import Alert  
  const handleShowImportAlert = async () => {
    await menuController.close();
    setShowImportAlert(true);
  };

  // Refresh
  const handleRefresh = async (event: CustomEvent) => {
    try {
      // Recargar reminders desde storage
      const savedRem = await storage?.get(STORAGE_REMINDERS);
      if (savedRem) {
        const list = savedRem as Reminder[];
        const listWithIds = list.map(r => r.id ? r : { ...r, id: Date.now().toString() + Math.random().toString() });
        setReminders(listWithIds);
      }
      
      // Recargar filtros
      const savedFilt = await storage?.get(STORAGE_FILTERS);
      if (savedFilt) setFilters(savedFilt as Filters);
      
    } catch (error) {
      console.error('Error al recargar:', error);
    } finally {
      event.detail.complete();
    }
  };

  useEffect(() => {
    const init = async () => {
      const stor = new Storage(); 
      await stor.create(); 
      setStorage(stor);
      const savedRem = await stor.get(STORAGE_REMINDERS);
      const savedFilt = await stor.get(STORAGE_FILTERS);
      if (savedRem) {
        const list = savedRem as Reminder[]; 
        const listWithIds = list.map(r => r.id ? r : { ...r, id: Date.now().toString() + Math.random().toString() });
        setReminders(listWithIds);
        listWithIds.forEach((r, idx) => r.alarm && scheduleNotification(r, idx));
      }
      if (savedFilt) setFilters(savedFilt as Filters);
      await LocalNotifications.requestPermissions();
    }; 
    init();
  }, []);

  const saveReminders = async (list: Reminder[]) => { 
    setReminders(list); 
    await storage?.set(STORAGE_REMINDERS, list); 
  };

  const saveFilters = async (newFilters: Filters) => { 
    setFilters(newFilters); 
    await storage?.set(STORAGE_FILTERS, newFilters); 
  };

  const scheduleNotification = async (rem: Reminder, id: number) => {
    if (!rem.alarm) return; 
    const at = new Date(rem.alarm); 
    if (at <= new Date()) return;
    await LocalNotifications.schedule({ 
      notifications: [{ 
        id, 
        title: `${rem.emoji} ${rem.title}`, 
        body: rem.desc || '', 
        schedule: { at } 
      }] 
    });
  };

  // Función para exportar datos
  const handleExport = async () => {
    try {
      const remindersData = await storage?.get(STORAGE_REMINDERS) || [];
      const extraRemindersData = await storage?.get(STORAGE_EXTRAREMINDERS) || [];
      
      // Crear datos para exportar
      const remindersBlob = new Blob([JSON.stringify(remindersData, null, 2)], {
        type: 'application/json'
      });
      const extraRemindersBlob = new Blob([JSON.stringify(extraRemindersData, null, 2)], {
        type: 'application/json'
      });

      // Crear enlaces de descarga
      const remindersUrl = URL.createObjectURL(remindersBlob);
      const extraRemindersUrl = URL.createObjectURL(extraRemindersBlob);

      // Descargar reminders
      const remindersLink = document.createElement('a');
      remindersLink.href = remindersUrl;
      remindersLink.download = 'reminders.json';
      document.body.appendChild(remindersLink);
      remindersLink.click();
      document.body.removeChild(remindersLink);

      // Descargar extra reminders
      const extraRemindersLink = document.createElement('a');
      extraRemindersLink.href = extraRemindersUrl;
      extraRemindersLink.download = 'extrareminders.json';
      document.body.appendChild(extraRemindersLink);
      extraRemindersLink.click();
      document.body.removeChild(extraRemindersLink);

      // Limpiar URLs
      URL.revokeObjectURL(remindersUrl);
      URL.revokeObjectURL(extraRemindersUrl);

      setToastMessage('Datos exportados exitosamente');
      setShowToast(true);
    } catch (error) {
      console.error('Error al exportar:', error);
      setToastMessage('Error al exportar los datos');
      setShowToast(true);
    }
  };

  // Función para importar datos
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json';
    
    input.onchange = async (event: any) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      try {
        for (const file of files) {
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (file.name.includes('reminders') && !file.name.includes('extra')) {
            await storage?.set(STORAGE_REMINDERS, data);
            setReminders(data);
          } else if (file.name.includes('extrareminders')) {
            await storage?.set(STORAGE_EXTRAREMINDERS, data);
          }
        }
        
        setToastMessage('Datos importados exitosamente');
        setShowToast(true);
      } catch (error) {
        console.error('Error al importar:', error);
        setToastMessage('Error al importar los datos. Verifica que los archivos sean válidos.');
        setShowToast(true);
      }
    };
    
    input.click();
  };

  const handleSave = async () => {
    if (!title || !priorityEmoji) return;
    const newR: Reminder = { 
      title, 
      desc, 
      datetime: new Date().toISOString(), 
      emoji: priorityEmoji, 
      alarm: useAlarm ? alarm : undefined,
      id: Date.now().toString() + Math.random().toString()
    };
    const list = [...reminders, newR]; 
    await saveReminders(list);
    scheduleNotification(newR, list.length - 1);
    resetForm(); 
    setShowAddModal(false);
  };

  const handleEdit = async () => {
    if (editIndex === undefined) return; 
    const list = [...reminders];
    list[editIndex] = { 
      ...list[editIndex],
      title, 
      desc, 
      emoji: priorityEmoji, 
      alarm: useAlarm ? alarm : undefined 
    };
    await saveReminders(list); 
    scheduleNotification(list[editIndex], editIndex);
    resetForm(); 
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (editIndex === undefined) return; 
    const list = reminders.filter((_, i) => i !== editIndex);
    await saveReminders(list); 
    resetForm(); 
    setShowEditModal(false);
  };

  const resetForm = () => { 
    setTitle(''); 
    setDesc(''); 
    setPriorityEmoji(''); 
    setAlarm(undefined); 
    setUseAlarm(false); 
    setEditIndex(undefined); 
  };

  const filtered = reminders.filter(r => 
    (r.emoji === '🔴' && filters.max) || 
    (r.emoji === '🟡' && filters.med) || 
    (r.emoji === '🟢' && filters.min)
  );

  const handleReorder = async (event: CustomEvent) => {
    const { from, to, complete } = event.detail;
    
    const newReminders = [...reminders];
    const filteredItems = filtered.map(item => 
      newReminders.findIndex(r => r.id === item.id)
    );
    
    const fromIndex = filteredItems[from];
    const toIndex = filteredItems[to];
    
    if (fromIndex !== -1 && toIndex !== -1) {
      const [movedItem] = newReminders.splice(fromIndex, 1);
      newReminders.splice(toIndex, 0, movedItem);
      await saveReminders(newReminders);
    }
    
    complete();
  };

  return (
    <>
      <IonMenu contentId="main-content">
        <div className='imageDiv'>
          <IonImg className='menuImage' src='/images/menu_logo.png'/>
        </div>
        <IonContent className="ion-padding" style={{
          '--background': 'var(--ion-item-background, var(--ion-background-color))'
        }}>
          <IonMenuToggle>
            <IonItem button onClick={handleAboutUs}>
              <IonLabel>Sobre Nosotros</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem button onClick={handleShowExportAlert}>
              <IonLabel>Exportar</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem button onClick={handleShowImportAlert}>
              <IonLabel>Importar</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonContent>
      </IonMenu>
      
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton/>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding" style={{
          '--background': 'var(--ion-item-background, var(--ion-background-color))'
        }}>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent pullingText="Desliza para recargar" refreshingText="Recargando..."/>
          </IonRefresher>
          <h1 className='titleh1' style={{textAlign:'center'}}>Pro Reminder</h1>
          <div style={{display:'flex',justifyContent:'space-between',margin:'16px 0'}}>
            <IonButton color='success' shape="round" onClick={() => setShowFilterModal(true)}>
              <IonIcon icon={funnel}/>
            </IonButton>
            <IonButton onClick={() => setShowAddModal(true)}>
              Agregar <IonIcon icon={add} slot="end"/>
            </IonButton>
          </div>
          
          <IonList>
            {filters.custom ? (
              <IonReorderGroup disabled={!filters.custom} onIonItemReorder={handleReorder}>
                {filtered.map((r, i) => (
                  <IonItem key={r.id} button onClick={() => {
                    const originalIndex = reminders.findIndex(rem => rem.id === r.id);
                    setEditIndex(originalIndex); 
                    setTitle(r.title); 
                    setDesc(r.desc || ''); 
                    setPriorityEmoji(r.emoji); 
                    setAlarm(r.alarm); 
                    setUseAlarm(!!r.alarm); 
                    setShowEditModal(true);
                  }}>
                    <IonReorder slot="end"/>
                    <IonLabel>{r.emoji} {r.title}</IonLabel>
                  </IonItem>
                ))}
              </IonReorderGroup>
            ) : (
              filtered.map((r, i) => (
                <IonItem key={r.id} button onClick={() => {
                  const originalIndex = reminders.findIndex(rem => rem.id === r.id);
                  setEditIndex(originalIndex); 
                  setTitle(r.title); 
                  setDesc(r.desc || ''); 
                  setPriorityEmoji(r.emoji); 
                  setAlarm(r.alarm); 
                  setUseAlarm(!!r.alarm); 
                  setShowEditModal(true);
                }}>
                  <IonLabel>{r.emoji} {r.title}</IonLabel>
                </IonItem>
              ))
            )}
          </IonList>

          {/* Export Alert */}
          <IonAlert
            isOpen={showExportAlert}
            onDidDismiss={() => setShowExportAlert(false)}
            header="Exportar Datos"
            message="¿Deseas exportar todos los recordatorios? Se descargarán dos archivos JSON."
            buttons={[
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Exportar',
                handler: handleExport
              }
            ]}
          />

          {/* Import Alert */}
          <IonAlert
            isOpen={showImportAlert}
            onDidDismiss={() => setShowImportAlert(false)}
            header="Importar Datos"
            message="¿Deseas importar recordatorios? Selecciona los archivos JSON correspondientes."
            buttons={[
              {
                text: 'Cancelar',
                role: 'cancel'
              },
              {
                text: 'Seleccionar Archivos',
                handler: handleImport
              }
            ]}
          />

          {/* Toast */}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            position="bottom"
          />

          {/* Filter Modal */}
          <IonModal isOpen={showFilterModal} onDidDismiss={() => setShowFilterModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonButtons slot="start">
                  <IonButton onClick={() => setShowFilterModal(false)}>
                    <IonIcon icon={chevronBack}/>
                  </IonButton>
                </IonButtons>
                <IonTitle>Filtrar</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{
              '--background': 'var(--ion-item-background, var(--ion-background-color))'
            }}>
              <h5>Prioridades</h5>
              <IonItem>
                <IonCheckbox 
                  checked={filters.max} 
                  slot="end" 
                  onIonChange={e => saveFilters({...filters, max: e.detail.checked})}
                />
                <IonLabel>🔴 Máxima</IonLabel>
              </IonItem>
              <IonItem>
                <IonCheckbox 
                  checked={filters.med} 
                  slot="end" 
                  onIonChange={e => saveFilters({...filters, med: e.detail.checked})}
                />
                <IonLabel>🟡 Media</IonLabel>
              </IonItem>
              <IonItem>
                <IonCheckbox 
                  checked={filters.min} 
                  slot="end" 
                  onIonChange={e => saveFilters({...filters, min: e.detail.checked})}
                />
                <IonLabel>🟢 Mínima</IonLabel>
              </IonItem>
              <h5>Otros</h5>
              <IonItem>
                <IonToggle 
                  checked={filters.custom} 
                  slot="end" 
                  onIonChange={e => saveFilters({...filters, custom: e.detail.checked})}
                />
                <IonLabel>Personalizado</IonLabel>
              </IonItem>
            </IonContent>
          </IonModal>

          {/* Add Modal */}
          <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonButtons slot="start">
                  <IonButton onClick={() => {resetForm(); setShowAddModal(false);}}>
                    <IonIcon icon={chevronBack}/>
                  </IonButton>
                </IonButtons>
                <IonTitle>Agrega un Recordatorio</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{
              '--background': 'var(--ion-item-background, var(--ion-background-color))'
            }}>
              <IonItem>
                <IonInput 
                  value={title} 
                  placeholder="Título" 
                  onIonChange={e => setTitle((e.target as any).value)}
                />
              </IonItem>
              <IonItem>
                <IonTextarea 
                  value={desc} 
                  placeholder="Descripción (opcional)" 
                  onIonChange={e => setDesc((e.target as any).value)}
                />
              </IonItem>
              <IonItem>
                <IonSelect 
                  value={priorityEmoji} 
                  placeholder="Elige prioridad" 
                  onIonChange={e => setPriorityEmoji((e.target as any).value)}
                >
                  <IonSelectOption value="🔴">Máxima</IonSelectOption>
                  <IonSelectOption value="🟡">Media</IonSelectOption>
                  <IonSelectOption value="🟢">Mínima</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonToggle 
                  checked={useAlarm} 
                  onIonChange={e => setUseAlarm(e.detail.checked)}
                >
                  <IonLabel>Alarma de Notificación</IonLabel>
                </IonToggle>
              </IonItem>
              {useAlarm && 
                <div style={{textAlign:'center', margin:'16px 0'}}>
                  <center>
                    <IonDatetime 
                      presentation="date-time" 
                      value={alarm} 
                      onIonChange={(e: any) => setAlarm(e.detail.value)}
                    />
                  </center>
                </div>
              }
              <IonButton expand="block" style={{marginTop:'16px'}} onClick={handleSave}>
                Guardar
              </IonButton>
            </IonContent>
          </IonModal>

          {/* Edit Modal */}
          <IonModal isOpen={showEditModal} onDidDismiss={() => {resetForm(); setShowEditModal(false);}}>
            <IonHeader>
              <IonToolbar>
                <IonButtons slot="start">
                  <IonButton onClick={() => {resetForm(); setShowEditModal(false);}}>
                    <IonIcon icon={chevronBack}/>
                  </IonButton>
                </IonButtons>
                <IonTitle>Editar Recordatorio</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{
              '--background': 'var(--ion-item-background, var(--ion-background-color))'
            }}>
              <IonItem>
                <IonInput 
                  value={title} 
                  placeholder="Título" 
                  onIonChange={e => setTitle((e.target as any).value)}
                />
              </IonItem>
              <IonItem>
                <IonTextarea 
                  value={desc} 
                  placeholder="Descripción (opcional)" 
                  onIonChange={e => setDesc((e.target as any).value)}
                />
              </IonItem>
              <IonItem>
                <IonSelect 
                  value={priorityEmoji} 
                  placeholder="Elige prioridad" 
                  onIonChange={e => setPriorityEmoji((e.target as any).value)}
                >
                  <IonSelectOption value="🔴">Máxima</IonSelectOption>
                  <IonSelectOption value="🟡">Media</IonSelectOption>
                  <IonSelectOption value="🟢">Mínima</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonToggle 
                  checked={useAlarm} 
                  onIonChange={e => setUseAlarm(e.detail.checked)}
                >
                  <IonLabel>Alarma de Notificación</IonLabel>
                </IonToggle>
              </IonItem>
              {useAlarm && 
                <div style={{textAlign:'center', margin:'16px 0'}}>
                  <center>
                    <IonDatetime 
                      presentation="date-time" 
                      value={alarm} 
                      onIonChange={(e: any) => setAlarm(e.detail.value)}
                    />
                  </center>
                </div>
              }
              <IonButton expand="block" style={{marginTop:'16px'}} onClick={handleEdit}>
                Guardar Cambios
              </IonButton>
              <IonButton expand="block" color="danger" fill="clear" onClick={handleDelete}>
                Eliminar
              </IonButton>
            </IonContent>
          </IonModal>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Home;