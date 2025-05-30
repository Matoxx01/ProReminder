import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/react';
import { chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Aboutus.css';

const Aboutus: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
            <IonButtons slot="start">
                <IonButton onClick={() => history.push('/home')}>
                  <IonIcon icon={chevronBack}/>
                </IonButton>
            </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <center>
            <img className='imageEmp' src='./images/CyaxDev - Icon.png' />
            <h1 className='titleh1'>CyaxDev</h1>
            <p className='parrafo'>Empresa de desarrollo creada por Matías Barrios para soluciones
             informáticas al servicio de los usuarios. Hecha en 2025, impulsada a 
             alcanzar más objetivos de máxima necesidad. Esperamos que Pro Reminder 
             te beneficie en tu día a día, ¡gracias!</p>
        </center>
      </IonContent>
    </IonPage>
  );
};

export default Aboutus;
