import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { Grid, Wheat, Croissant, CakeSlice, Coffee } from 'lucide-react-native';

const getCategoryIcon = (categoryName: string, color: string, size = 16) => {
  switch (categoryName) {
    case 'Todos':
      return <Grid size={size} color={color} />;
    case 'Pães':
      return <Wheat size={size} color={color} />;
    case 'Folhados':
      return <Croissant size={size} color={color} />;
    case 'Doces':
      return <CakeSlice size={size} color={color} />;
    case 'Bebidas':
      return <Coffee size={size} color={color} />;
    default:
      return <Grid size={size} color={color} />;
  }
};

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <View className="mt-6">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelectCategory(cat)}
              className={`px-4 py-2.5 rounded-full mr-3 border flex-row items-center ${
                isSelected 
                  ? 'bg-tiffany border-tiffany' 
                  : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'
              }`}
            >
              {getCategoryIcon(cat, isSelected ? '#fff' : '#666')}
              <Text className={`font-semibold text-xs ml-1.5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
