import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonImg,
  IonMenu,
  IonItem,
  IonToggle,
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
  IonDatetime,
  IonReorder,
  IonReorderGroup,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { add, funnel, chevronBack } from 'ionicons/icons';
import { Storage } from '@ionic/storage';
import { useHistory } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { menuController } from '@ionic/core';
import './extras.css';

interface ExtraReminder {
  id: string;
  title: string;
  desc?: string;
  datetime: string;
  emoji: string;
  alarm?: string;
}

interface ExtraFilters { 
  reorderable: boolean; 
}

// Interfaz para los reminders normales (faltaba esta definición)
interface Reminder {
  title: string;
  desc?: string;
  datetime: string;
  emoji: string;
  alarm?: string;
  id: string;
}

const STORAGE_EXTRAFILTERS = 'extrafilters';
const STORAGE_EXTRAREMINDERS = 'extrareminders';
const STORAGE_REMINDERS = 'reminders';

const Extras: React.FC = () => {
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
  const [emojiInput, setEmojiInput] = useState('');
  const [alarm, setAlarm] = useState<string>();
  const [useAlarm, setUseAlarm] = useState(false);

  // Data
  const [extraReminders, setExtraReminders] = useState<ExtraReminder[]>([]);
  const [extraFilters, setExtraFilters] = useState<ExtraFilters>({ reorderable: false });
  
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
      // Recargar extra reminders desde storage
      const savedRem = await storage?.get(STORAGE_EXTRAREMINDERS);
      if (savedRem) {
        let list = savedRem as ExtraReminder[];
        list = list.map((r, idx) => ({
          ...r,
          id: r.id || `legacy_${idx}_${Date.now()}`
        }));
        setExtraReminders(list);
      }
      
      // Recargar filtros
      const savedFilt = await storage?.get(STORAGE_EXTRAFILTERS);
      if (savedFilt) setExtraFilters(savedFilt as ExtraFilters);
      
    } catch (error) {
      console.error('Error al recargar:', error);
    } finally {
      event.detail.complete();
    }
  };

  const generateId = (): string => {
    return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    const init = async () => {
      const stor = new Storage(); 
      await stor.create(); 
      setStorage(stor);
      
      const savedRem = await stor.get(STORAGE_EXTRAREMINDERS);
      const savedFilt = await stor.get(STORAGE_EXTRAFILTERS);
      
      if (savedRem) {
        let list = savedRem as ExtraReminder[];
        // Ensure all reminders have IDs (backward compatibility)
        list = list.map((r, idx) => ({
          ...r,
          id: r.id || `legacy_${idx}_${Date.now()}`
        }));
        setExtraReminders(list);
        list.forEach((r, idx) => r.alarm && scheduleNotification(r, idx));
      }
      if (savedFilt) setExtraFilters(savedFilt as ExtraFilters);
      
      await LocalNotifications.requestPermissions();
    }; 
    init();
  }, []);

  const saveExtraReminders = useCallback(async (list: ExtraReminder[]) => { 
    setExtraReminders(list); 
    await storage?.set(STORAGE_EXTRAREMINDERS, list); 
  }, [storage]);

  const saveExtraFilters = useCallback(async (newFilters: ExtraFilters) => { 
    setExtraFilters(newFilters); 
    await storage?.set(STORAGE_EXTRAFILTERS, newFilters); 
  }, [storage]);

  const scheduleNotification = async (rem: ExtraReminder, id: number) => {
    if (!rem.alarm) return; 
    const at = new Date(rem.alarm); 
    if (at <= new Date()) return;
    await LocalNotifications.schedule({ 
      notifications: [{ 
        id: id + 1000,
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
          } else if (file.name.includes('extrareminders')) {
            await storage?.set(STORAGE_EXTRAREMINDERS, data);
            setExtraReminders(data); // Actualizar el estado local
          }
        }
        
        setToastMessage('Datos importados exitosamente. Recarga la página para ver los cambios.');
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
    if (!title || !emojiInput) return;
    
    const newR: ExtraReminder = { 
      id: generateId(),
      title, 
      desc, 
      datetime: new Date().toISOString(), 
      emoji: emojiInput, 
      alarm: useAlarm ? alarm : undefined 
    };
    
    const list = [...extraReminders, newR]; 
    await saveExtraReminders(list);
    scheduleNotification(newR, list.length - 1);
    resetForm(); 
    setShowAddModal(false);
  };

  const handleEdit = async () => {
    if (editIndex === undefined) return; 
    const list = [...extraReminders];
    list[editIndex] = { 
      ...list[editIndex],
      title, 
      desc, 
      emoji: emojiInput, 
      alarm: useAlarm ? alarm : undefined 
    };
    await saveExtraReminders(list); 
    scheduleNotification(list[editIndex], editIndex);
    resetForm(); 
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (editIndex === undefined) return; 
    const list = extraReminders.filter((_, i) => i !== editIndex);
    await saveExtraReminders(list); 
    resetForm(); 
    setShowEditModal(false);
  };

  const resetForm = () => { 
    setTitle(''); 
    setDesc(''); 
    setEmojiInput(''); 
    setAlarm(undefined); 
    setUseAlarm(false); 
    setEditIndex(undefined); 
  };

  const handleReorder = (e: any) => {
    const list = [...extraReminders];
    const movedItem = list.splice(e.detail.from, 1)[0];
    list.splice(e.detail.to, 0, movedItem);
    
    setExtraReminders(list);
    e.detail.complete();
    
    setTimeout(() => {
      storage?.set(STORAGE_EXTRAREMINDERS, list);
    }, 0);
  };

  return (
    <>
      <IonMenu contentId="main-content">
        <div className='imageDiv'>
          <IonImg className='menuImage' src='/images/menu_logo.png'/>
        </div>
        <IonContent className="ion-padding">
          <IonItem button onClick={handleAboutUs}>
            <IonLabel>Sobre Nosotros</IonLabel>
          </IonItem>
          <IonItem button onClick={handleShowExportAlert}>
            <IonLabel>Exportar</IonLabel>
          </IonItem>
          <IonItem button onClick={handleShowImportAlert}>
            <IonLabel>Importar</IonLabel>
          </IonItem>
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
          <h1 className='titleh1' style={{textAlign:'center'}}>Extra Reminders</h1>
          
          <div style={{display:'flex',justifyContent:'space-between',margin:'16px 0'}}>
            <IonButton color='success' shape="round" onClick={() => setShowFilterModal(true)}>
              <IonIcon icon={funnel}/>
            </IonButton>
            <IonButton onClick={() => setShowAddModal(true)}>
              Agregar <IonIcon icon={add} slot="end"/>
            </IonButton>
          </div>

          <IonList>
            {extraFilters.reorderable ? (
              <IonReorderGroup disabled={!extraFilters.reorderable} onIonItemReorder={handleReorder}>
                {extraReminders.map((r, i) => (
                  <IonItem key={r.id} button onClick={() => {
                    setEditIndex(i); 
                    const e = r; 
                    setTitle(e.title); 
                    setDesc(e.desc || ''); 
                    setEmojiInput(e.emoji); 
                    setAlarm(e.alarm); 
                    setUseAlarm(!!e.alarm); 
                    setShowEditModal(true);
                  }}>
                    <IonReorder slot="end"/>
                    <IonLabel>{r.emoji} {r.title}</IonLabel>
                  </IonItem>
                ))}
              </IonReorderGroup>
            ) : (
              extraReminders.map((r, i) => (
                <IonItem key={r.id} button onClick={() => {
                  setEditIndex(i); 
                  const e = r; 
                  setTitle(e.title); 
                  setDesc(e.desc || ''); 
                  setEmojiInput(e.emoji); 
                  setAlarm(e.alarm); 
                  setUseAlarm(!!e.alarm); 
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
              <IonItem>
                <IonToggle 
                  checked={extraFilters.reorderable} 
                  slot="end" 
                  onIonChange={e => saveExtraFilters({...extraFilters, reorderable: e.detail.checked})}
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
                <IonInput 
                  value={emojiInput} 
                  placeholder="Ingresa un emoji 🎯" 
                  maxlength={2}
                  onIonChange={e => setEmojiInput((e.target as any).value)}
                />
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
                <IonTitle>Editar Extra Recordatorio</IonTitle>
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
                <IonInput 
                  value={emojiInput} 
                  placeholder="Ingresa un emoji 🎯" 
                  maxlength={2}
                  onIonChange={e => setEmojiInput((e.target as any).value)}
                />
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

export default Extras;