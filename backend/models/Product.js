const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Kits', 'Training', 'Equipment', 'Accessories'],
            message: 'Please select a valid category'
        }
    },
    gender: {
        type: String,
        required: [true, 'Gender target is required'],
        enum: {
            values: ['Unisex', 'Men', 'Women', 'Kids'],
            message: 'Please select a valid gender'
        },
        default: 'Unisex'
    },
    imageUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+/i.test(v);
            },
            message: 'Please provide a valid image URL'
        }
    },
    images: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    sizes: {
        type: [String],
        default: ['S', 'M', 'L', 'XL']
    },
    tags: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);
