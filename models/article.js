module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    title: DataTypes.TEXT,
    link: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    content: DataTypes.TEXT,
    full_content: DataTypes.TEXT,
    image_url: DataTypes.TEXT,
    author: DataTypes.TEXT,
    category: DataTypes.TEXT,
    fetched_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    raw_data: DataTypes.JSON
  }, {
    tableName: 'articles',
    timestamps: false
  });

  Article.associate = function(models) {
    Article.belongsTo(models.Source, { foreignKey: 'source_id' });
  };

  return Article;
};