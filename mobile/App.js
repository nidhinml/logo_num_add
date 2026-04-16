import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  TextInput,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

const BACKEND_URL = 'http://YOUR_LOCAL_IP:5000/api'; // Change to your local machine's IP

export default function App() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState(null);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets);
      uploadImages(result.assets);
    }
  };

  const pickLogo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled) {
      uploadLogo(result.assets[0]);
    }
  };

  const uploadImages = async (assets) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    assets.forEach((asset, index) => {
      formData.append('images', {
        uri: asset.uri,
        name: `image_${index}.jpg`,
        type: 'image/jpeg',
      });
    });

    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(res.data.files);
    } catch (err) {
      Alert.alert('Upload Error', err.message);
    }
  };

  const uploadLogo = async (asset) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('logo', {
      uri: asset.uri,
      name: 'logo.png',
      type: 'image/png',
    });

    try {
      const res = await axios.post(`${BACKEND_URL}/upload-logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogo({ path: res.data.logoPath, url: res.data.logoUrl });
    } catch (err) {
      Alert.alert('Logo Upload Error', err.message);
    }
  };

  const processAll = async () => {
    if (images.length === 0) return;
    setProcessing(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/process`, {
        sessionId,
        images,
        logoSettings: logo ? { path: logo.path, size: 'medium', position: 'bottom-right', opacity: 1 } : null,
        whatsappSettings: {
          enabled: whatsappEnabled,
          number: whatsappNumber,
          position: 'bottom-left',
          fontSize: 30,
          color: '#ffffff',
          showIcon: true,
          showNumber: true
        }
      });

      Alert.alert(
        'Success', 
        'Images processed successfully!',
        [
          { text: 'Download All', onPress: () => downloadResults() },
          { text: 'OK' }
        ]
      );
    } catch (err) {
      Alert.alert('Processing Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResults = async () => {
     const uri = `${BACKEND_URL}/download-zip/${sessionId}`;
     const fileUri = `${FileSystem.documentDirectory}branded_images.zip`;
     
     const downloadRes = await FileSystem.downloadAsync(uri, fileUri);
     if (downloadRes.status === 200) {
        await Sharing.shareAsync(fileUri);
     } else {
        Alert.alert('Download failed', 'Could not fetch processed images');
     }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BrandFlow Mobile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>1. Select Images</Text>
        <TouchableOpacity style={styles.button} onPress={pickImages}>
          <Text style={styles.buttonText}>Pick Multiple Images</Text>
        </TouchableOpacity>
        <Text style={styles.info}>{images.length} images selected</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>2. Select Logo</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#475569' }]} onPress={pickLogo}>
          <Text style={styles.buttonText}>{logo ? 'Change Logo' : 'Upload Logo'}</Text>
        </TouchableOpacity>
        {logo && <Image source={{ uri: logo.url }} style={styles.logoPreview} />}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>WhatsApp Branding</Text>
          <Switch value={whatsappEnabled} onValueChange={setWhatsappEnabled} />
        </View>
        {whatsappEnabled && (
          <TextInput
            style={styles.input}
            placeholder="WhatsApp Number"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
          />
        )}
      </View>

      <TouchableOpacity 
        style={[styles.processButton, (!images.length || processing) && styles.disabled]} 
        onPress={processAll}
        disabled={!images.length || processing}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Apply Branding to All</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 15,
  },
  label: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  info: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#0284c7',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  logoPreview: {
    width: 60,
    height: 60,
    marginTop: 10,
    resizeMode: 'contain',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#334155',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  }
});
