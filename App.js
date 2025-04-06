import React, { useState, useEffect } from 'react';
import {h View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [lists, setLists] = useState({});
  const [activeListName, setActiveListName] = useState('');
  const [itemText, setItemText] = useState('');
  const [newListName, setNewListName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [isPaidVersion, setIsPaidVersion] = useState(false); // Määritellään maksullinen versio

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [lists]);

  const loadData = async () => {
    try {
      const json = await AsyncStorage.getItem('@shopping_lists');
      if (json) setLists(JSON.parse(json));
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('@shopping_lists', JSON.stringify(lists));
    } catch (e) {
      console.log('Error saving data:', e);
    }
  };

  const addItem = () => {
    if (!itemText.trim()) return;
    const newItem = { name: itemText.trim(), bought: false };
    if (activeListName) {
      const currentList = lists[activeListName] || [];
      if (editIndex !== null) {
        currentList[editIndex] = newItem;
        setEditIndex(null);
      } else {
        currentList.push(newItem);
      }
      setLists({ ...lists, [activeListName]: currentList });
    } else {
      const newListName = generateNewListName();
      const newList = { [newListName]: [newItem] };
      setLists({ ...lists, ...newList });
      setActiveListName(newListName);
    }
    setItemText('');
  };

  const generateNewListName = () => {
    let listNumber = 1;
    while (lists[`Lista ${listNumber}`]) {
      listNumber++;
    }
    return `Lista ${listNumber}`;
  };

  const toggleBought = (index) => {
    const updatedList = [...lists[activeListName]];
    updatedList[index].bought = !updatedList[index].bought;
    setLists({ ...lists, [activeListName]: updatedList });
  };

  const deleteItem = (index) => {
    const updatedList = [...lists[activeListName]];
    updatedList.splice(index, 1);
    setLists({ ...lists, [activeListName]: updatedList });
  };

  const deleteList = () => {
    const updatedLists = { ...lists };
    delete updatedLists[activeListName];
    setLists(updatedLists);
    setActiveListName('');
  };

  const editItem = (index) => {
    setItemText(lists[activeListName][index].name);
    setEditIndex(index);
  };

  const createNewList = () => {
    const newListName = generateNewListName();
    const newList = { [newListName]: [] };
    setLists({ ...lists, ...newList });
    setActiveListName(newListName);
    setNewListName('');
    setModalVisible(false);
  };

  const handleListNameChange = (text) => {
    setNewListName(text);
  };

  const saveListName = () => {
    const updatedLists = { ...lists, [newListName]: lists[activeListName] };
    delete updatedLists[activeListName];
    setLists(updatedLists);
    setActiveListName(newListName);
    setIsEditingListName(false);
  };

  const shareList = (platform) => {
    const listItems = lists[activeListName].map(item => item.name).join('\n');
    const message = `Ostoslista: ${activeListName}\n\n${listItems}`;

    switch (platform) {
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
        break;
      case 'messenger':
        Linking.openURL(`fb-messenger://share/?link=${encodeURIComponent(message)}`);
        break;
      case 'sms':
        Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
        break;
      default:
        break;
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemTextWrap} onPress={() => toggleBought(index)}>
        <Text style={[styles.itemText, item.bought && styles.bought]}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => editItem(index)}>
        <MaterialIcons name="edit" size={24} color="#4caf50" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteItem(index)} style={{ marginLeft: 10 }}>
        <MaterialIcons name="delete" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  const renderListItem = ({ item }) => (
    <TouchableOpacity onPress={() => setActiveListName(item)}>
      <Text style={styles.listItem}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ostoslista</Text>

      {/* Lista palkissa */}
      <View style={styles.listBar}>
        <FlatList
          data={Object.keys(lists)}
          renderItem={renderListItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.listHeader}>Listat:</Text>}
        />
      </View>

      {/* Aktiivisen listan nimen ja jakamisen toiminnot */}
      {activeListName && !isEditingListName && (
        <View style={styles.listActions}>
          <TouchableOpacity onPress={() => shareList('whatsapp')}>
            <MaterialIcons name="share" size={24} color="#00796b" />
          </TouchableOpacity>
          <Text style={styles.activeListName}>{activeListName}</Text>
          <TouchableOpacity onPress={() => setIsEditingListName(true)}>
            <MaterialIcons name="edit" size={24} color="#4caf50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteList} style={styles.deleteListButton}>
            <MaterialIcons name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {isEditingListName && (
        <View style={styles.listActions}>
          <TextInput
            style={styles.input}
            value={newListName}
            onChangeText={handleListNameChange}
            onSubmitEditing={saveListName}
          />
          <TouchableOpacity onPress={saveListName}>
            <Text style={styles.saveListName}>Tallenna nimi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tuotteen lisäys */}
      <TextInput
        style={styles.input}
        placeholder="Lisää tai muokkaa tuotetta..."
        value={itemText}
        onChangeText={setItemText}
        onSubmitEditing={addItem}
        returnKeyType="done"
      />

      {/* Listan tuotteet */}
      {activeListName && (
        <FlatList
          data={lists[activeListName] || []}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
        />
      )}

      {/* Uuden listan luominen */}
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Uusi lista</Text>
      </TouchableOpacity>

      {/* Modal uuden listan luomiseen */}
      <Modal visible={modalVisible} transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Uusi lista</Text>
            <TouchableOpacity onPress={createNewList} style={styles.button}>
              <Text style={styles.buttonText}>Luo lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mainokset näkyville vain ilmaisversiossa */}
      {!isPaidVersion && (
        <View style={styles.ads}>
          <Text style={styles.adsText}>Tämä on ilmainen versio. Poista mainokset ostamalla maksullinen versio!</Text>
          <TouchableOpacity onPress={() => setIsPaidVersion(true)} style={styles.removeAdsButton}>
            <Text style={styles.removeAdsText}>Poista mainokset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#00796b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: { color: '#fff' },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listContainer: {
    marginBottom: 10,
  },
  listItem: {
    fontSize: 18,
    padding: 8,
    backgroundColor: '#e0f7fa',
    marginBottom: 5,
    borderRadius: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  itemTextWrap: { flex: 1 },
  itemText: { fontSize: 18 },
  bought: { textDecorationLine: 'line-through', color: '#888' },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  activeListName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
  },
  saveListName: {
    color: '#00796b',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  deleteListButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    width: '80%',
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: '#fff' },
  ads: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  adsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  removeAdsButton: {
    backgroundColor: '#00796b',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  removeAdsText: {
    color: '#fff',
  },
});
