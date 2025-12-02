module.exports = (sequelize, DataTypes) => {
  const Source = sequelize.define('Source', {
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'sources',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  Source.associate = function(models) {
    Source.hasMany(models.Article, { foreignKey: 'source_id' });
  };

  return Source;
};