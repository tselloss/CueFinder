import React, { useState, useEffect } from 'react';
import { Upload, Trash2, X } from 'lucide-react';
import * as billiardTableService from '../../../api/billiardTableService';
import { getErrorMessage } from '../../../utils/errorUtils';
import { SITE_BASE_URL } from '../../../config/apiConfig';
import { Button } from '../../../components/ui/button.jsx';
import { Input } from '../../../components/ui/input.jsx';
import { Label } from '../../../components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select.jsx';
import { Textarea } from '../../../components/ui/textarea.jsx';

const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;
  return url;
};

export default function BilliardTableForm({ table, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    price: '',
    description: '',
    tableSize: '8-foot',
    tableType: 'pool',
    playingSurface: '',
    feltType: '',
    frameMaterial: '',
    pocketType: '',
    features: '',
    manufactureYear: '',
    condition: 'good',
    location: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (table) {
      setFormData({
        title: table.title || '',
        brand: table.brand || '',
        price: table.price || '',
        description: table.description || '',
        tableSize: table.tableSize || '8-foot',
        tableType: table.tableType || 'pool',
        playingSurface: table.playingSurface || '',
        feltType: table.feltType || '',
        frameMaterial: table.frameMaterial || '',
        pocketType: table.pocketType || '',
        features: table.features || '',
        manufactureYear: table.manufactureYear || '',
        condition: table.condition || 'good',
        location: table.location || ''
      });
      if (table.images && table.images.length > 0) {
        setImagePreviews(table.images.map(img => getImageUrl(img)));
      }
    }
  }, [table]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.brand || !formData.price) {
        setError('Please fill in title, brand, and price');
        setLoading(false);
        return;
      }

      if (imagePreviews.length === 0) {
        setError('📸 Please upload at least one photo of your table. Listings with photos get more attention!');
        setLoading(false);
        return;
      }

      const tableData = {
        ...formData,
        price: parseFloat(formData.price),
        manufactureYear: formData.manufactureYear ? parseInt(formData.manufactureYear) : null
      };

      if (table) {
        // Update existing table
        await billiardTableService.updateTable(table.id, tableData);
        onSave({ ...table, ...tableData });
      } else {
        // Create new table
        const createdTable = await billiardTableService.createTable(tableData);
        
        // Upload images if they're new files
        if (images.length > 0) {
          for (const image of images) {
            const imageFormData = new FormData();
            imageFormData.append('file', image);
            // Note: You'll need to implement image upload in the controller
            // For now, we'll skip this part as it requires additional implementation
          }
        }
        
        onSave(createdTable);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{table ? 'Edit Billiard Table' : 'List a Billiard Table'}</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Table Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Brunswick Gold Crown"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="e.g., Brunswick, Olhausen, Diamond"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the table's condition, features, history, etc."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableSize">Table Size</Label>
                <Select value={formData.tableSize} onValueChange={(value) => handleSelectChange('tableSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6-foot">6-foot</SelectItem>
                    <SelectItem value="7-foot">7-foot</SelectItem>
                    <SelectItem value="8-foot">8-foot</SelectItem>
                    <SelectItem value="9-foot">9-foot</SelectItem>
                    <SelectItem value="10-foot">10-foot</SelectItem>
                    <SelectItem value="12-foot">12-foot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tableType">Table Type</Label>
                <Select value={formData.tableType} onValueChange={(value) => handleSelectChange('tableType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool">Pool</SelectItem>
                    <SelectItem value="snooker">Snooker</SelectItem>
                    <SelectItem value="billiards">Billiards</SelectItem>
                    <SelectItem value="combination">Combination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="playingSurface">Playing Surface</Label>
                <Input
                  id="playingSurface"
                  name="playingSurface"
                  placeholder="e.g., Slate, Hybrid, Synthetic"
                  value={formData.playingSurface}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="feltType">Felt Type</Label>
                <Input
                  id="feltType"
                  name="feltType"
                  placeholder="e.g., Wool, Worsted, Color"
                  value={formData.feltType}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frameMaterial">Frame Material</Label>
                <Input
                  id="frameMaterial"
                  name="frameMaterial"
                  placeholder="e.g., Solid wood, Metal"
                  value={formData.frameMaterial}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="pocketType">Pocket Type</Label>
                <Input
                  id="pocketType"
                  name="pocketType"
                  placeholder="e.g., Leather, Rubber"
                  value={formData.pocketType}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Special Features</Label>
              <Input
                id="features"
                name="features"
                placeholder="e.g., LED lights, leg levelers, ball return"
                value={formData.features}
                onChange={handleChange}
              />
            </div>

            {/* Pricing and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manufactureYear">Year Manufactured</Label>
                <Input
                  id="manufactureYear"
                  name="manufactureYear"
                  type="number"
                  placeholder="YYYY"
                  value={formData.manufactureYear}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Los Angeles, CA"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Image Upload */}
            <div className="border-2 border-dashed rounded-lg p-4">
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <label className="cursor-pointer flex-1">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Click to upload images or drag and drop
                  </span>
                </label>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Saving...' : (table ? 'Update Table' : 'List Table')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
