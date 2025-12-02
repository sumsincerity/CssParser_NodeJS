module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define('Job', {
    source_name: DataTypes.STRING(50),
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    started_at: DataTypes.DATE,
    finished_at: DataTypes.DATE,
    error: DataTypes.TEXT,
    articles_count: DataTypes.INTEGER
  }, {
    tableName: 'jobs',
    timestamps: false
  });
  return Job;
};