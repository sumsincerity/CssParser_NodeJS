module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('articles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      source_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sources', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: Sequelize.TEXT,
      link: Sequelize.TEXT,
      content: Sequelize.TEXT,
      full_content: Sequelize.TEXT,
      image_url: Sequelize.TEXT,
      author: Sequelize.TEXT,
      category: Sequelize.TEXT,
      fetched_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      raw_data: Sequelize.JSON
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('articles');
  }
};