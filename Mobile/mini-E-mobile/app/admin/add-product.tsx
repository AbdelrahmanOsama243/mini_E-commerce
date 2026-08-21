import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkButton, KoshkInput } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { moderateScale, verticalScale } from '@/Utils/responsive';
import { ProductService } from '@/Services/Product.Service';

export default function AddProductScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Decor');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !category || !price || !stock || !imageUri) {
      Alert.alert('Validation', 'Please fill all fields and take a picture.');
      return;
    }
    
    setLoading(true);
    try {
      await ProductService.createProductWithImage({
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description,
      }, imageUri);
      
      Alert.alert('Success', 'Product created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take a picture.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setImageUri(photo.uri);
          setShowCamera(false);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraButtons}>
            <TouchableOpacity 
              style={[styles.camBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
              onPress={() => setShowCamera(false)}
            >
              <KoshkText variant="body" color={Palette.white}>Cancel</KoshkText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.captureBtn} 
              onPress={takePicture}
            />
            
            <TouchableOpacity 
              style={[styles.camBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]} 
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
            >
              <KoshkText variant="body" color={Palette.white}>Flip</KoshkText>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isDark ? Palette.darkSurface : Palette.offWhite }]}>
        <View style={styles.headerTop}>
          <View>
            <KoshkText variant="overline" color={colors.textSecondary}>
              INVENTORY
            </KoshkText>
            <KoshkText variant="h3">Add Product</KoshkText>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <KoshkText variant="body">←</KoshkText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <KoshkText variant="body" color={colors.textMuted}>No Image</KoshkText>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <KoshkButton 
              title={imageUri ? "Retake Photo" : "Take Photo"} 
              onPress={openCamera} 
              variant="outline"
              style={{ flex: 1 }}
            />
            <KoshkButton 
              title="Upload from Studio" 
              onPress={pickImage} 
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <KoshkInput
          label="Product Name"
          placeholder="e.g. Modern Chair"
          value={name}
          onChangeText={setName}
        />
        
        <KoshkInput
          label="Category"
          placeholder="e.g. Decor, Furniture..."
          value={category}
          onChangeText={setCategory}
        />
        
        <View style={styles.row}>
          <KoshkInput
            label="Price ($)"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            containerStyle={{ flex: 1 }}
          />
          <View style={{ width: Spacing.md }} />
          <KoshkInput
            label="Stock"
            placeholder="0"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            containerStyle={{ flex: 1 }}
          />
        </View>

        <KoshkInput
          label="DESCRIPTION"
          value={description}
          onChangeText={setDescription}
          multiline
          containerStyle={{ height: verticalScale(100) }}
        />

        <KoshkButton
          title={loading ? "Adding..." : "Add Product"}
          onPress={handleCreate}
          disabled={loading}
          style={{ marginTop: Spacing.xl, marginBottom: Spacing['4xl'] }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: Borders.brutalist,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  imagePreview: {
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: Borders.radius.sm,
    borderWidth: Borders.brutalist,
    borderColor: Palette.black,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: Borders.radius.sm,
    borderWidth: Borders.medium,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  camBtn: {
    padding: 15,
    borderRadius: 8,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Palette.white,
    borderWidth: 4,
    borderColor: Palette.grey200,
  },
});
