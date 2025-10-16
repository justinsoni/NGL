# News Storage Implementation - MongoDB Integration

## 📋 Overview

All news content (articles, transfers, best goals, and match reports) are now stored in **MongoDB** instead of localStorage. This provides a centralized, persistent storage solution.

## 🗂️ News Types

The system now supports **4 types** of news content:

1. **Articles** (`type: 'article'`) - Regular news articles from Admin/Manager "Manage News"
2. **Transfers** (`type: 'transfer'`) - Transfer news added by Club Managers
3. **Best Goals** (`type: 'best-goal'`) - Goal highlights added by Club Managers
4. **Match Reports** (`type: 'match-report'`) - Match reports added by Admins

## 🔧 Backend Changes

### 1. **NewsItem Model** (`backend/models/NewsItem.js`)
- Added `type` field with enum: `['article', 'transfer', 'best-goal', 'match-report']`
- Updated `category` enum to include: `['Features', 'News', 'Analysis', 'Transfers', 'Match Reports', 'Best Goals', 'Transfer News']`
- Made `content` field optional (not required) for simple news items

### 2. **Controller** (`backend/controllers/adminNewsItemController.js`)
- Added filtering support for `type`, `category`, and `club` in `getAllNewsItems`
- Query examples:
  - `/api/news?type=transfer` - Get all transfers
  - `/api/news?type=best-goal&club=Club Name` - Get best goals for a specific club
  - `/api/news?category=Match Reports` - Get all match reports

### 3. **Routes** (`backend/routes/newsItemRoutes.js`)
- Made `content` optional in validation (not all news types need full content)
- Added `type` field to validation

## 🎨 Frontend Changes

### **Admin Dashboard** (`frontend/pages/AdminDashboard.tsx`)

#### Match Reports:
- **Load**: Fetches from MongoDB filtered by `type: 'match-report'`
- **Create**: Saves to MongoDB with:
  ```typescript
  {
    title: "Report title",
    imageUrl: "uploaded_image_url",
    category: "Match Reports",
    type: "match-report",
    content: title,
    summary: title
  }
  ```
- **Delete**: Removes from MongoDB using `deleteNewsById`

### **Club Manager Dashboard** (`frontend/pages/ClubManagerDashboard.tsx`)

#### Transfers:
- **Load**: Fetches from MongoDB filtered by `type: 'transfer'` and club name
- **Create**: Saves to MongoDB with:
  ```typescript
  {
    title: "Transfer headline",
    imageUrl: "uploaded_image_url",
    category: "Transfer News",
    type: "transfer",
    content: title,
    summary: title
  }
  ```
- **Delete**: Removes from MongoDB using `deleteNewsById`

#### Best Goals:
- **Load**: Fetches from MongoDB filtered by `type: 'best-goal'` and club name
- **Create**: Saves to MongoDB with:
  ```typescript
  {
    title: "Goal highlight title",
    imageUrl: "uploaded_image_url",
    category: "Best Goals",
    type: "best-goal",
    content: title,
    summary: title
  }
  ```
- **Delete**: Removes from MongoDB using `deleteNewsById`

## 📊 Data Structure

All news items in MongoDB follow this structure:

```javascript
{
  _id: ObjectId,
  title: String (required),
  category: String (enum),
  type: String (enum: 'article', 'transfer', 'best-goal', 'match-report'),
  imageUrl: String,
  summary: String,
  content: String,
  author: String (auto-filled from authenticated user),
  club: String (auto-filled from authenticated user's club),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication & Authorization

All create/update/delete operations require:
- **Authentication**: Valid Firebase ID token
- **Authorization**: Role must be `admin` or `clubManager`
- **Auto-populated fields**:
  - `author`: User's name or email
  - `club`: User's club name (for club managers)

## 🎯 Benefits

1. ✅ **Centralized Storage**: All news in one MongoDB collection
2. ✅ **Persistent Data**: No data loss on browser cache clear
3. ✅ **Filtering**: Easy to query by type, category, or club
4. ✅ **Multi-device**: Access from any device
5. ✅ **Scalable**: Can handle large amounts of news content
6. ✅ **Audit Trail**: Track who created what and when

## 🧪 Testing

### Test Match Report Creation (Admin):
1. Login as admin
2. Go to "Manage Match Reports"
3. Add a match report with title and image
4. Check MongoDB - should see entry with `type: 'match-report'`

### Test Transfer Creation (Club Manager):
1. Login as club manager
2. Go to "Manage Transfers"
3. Add a transfer with title and image
4. Check MongoDB - should see entry with `type: 'transfer'` and your club name

### Test Best Goal Creation (Club Manager):
1. Login as club manager
2. Go to "Manage Best Goals"
3. Add a best goal with title and image
4. Check MongoDB - should see entry with `type: 'best-goal'` and your club name

## 📝 Migration Notes

- **Old localStorage data**: Will not be automatically migrated
- **Fresh start**: All new content will be saved to MongoDB
- **Backward compatibility**: Old localStorage data will be ignored

## 🔍 Debugging

Check MongoDB directly:
```javascript
// Get all news items
db.newsitems.find()

// Get transfers only
db.newsitems.find({ type: 'transfer' })

// Get best goals for a specific club
db.newsitems.find({ type: 'best-goal', club: 'Club Name' })

// Get match reports
db.newsitems.find({ type: 'match-report' })
```

## 🚀 Next Steps

Consider implementing:
1. Image upload directly to cloud storage (Cloudinary)
2. Rich text editor for full article content
3. News categories management
4. News approval workflow
5. News scheduling (publish at specific time)
